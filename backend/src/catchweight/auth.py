"""
Authentication and Authorization for CatchWeight POC.

Implements JWT-based authentication with role-based access control (RBAC).
Designed for SAP-compliant authorization patterns.
"""

import os
import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status, Header
from pydantic import BaseModel

from catchweight.db import get_connection

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-CHANGE-IN-PRODUCTION")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours


class LoginRequest(BaseModel):
    """Login credentials."""
    email: str
    password: str


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    full_name: str
    role_id: str
    role_name: str
    permissions: Dict[str, bool]


class CurrentUser(BaseModel):
    """Current authenticated user."""
    user_id: str
    email: str
    full_name: str
    role_id: str
    role_name: str
    permissions: Dict[str, bool]


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.

    Args:
        data: Payload data to encode in the token
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    """
    Authenticate a user by email and password.

    Args:
        email: User's email
        password: Plain text password

    Returns:
        User data dict if authentication succeeds, None otherwise
    """
    with get_connection() as conn:
        row = conn.execute("""
            SELECT u.user_id, u.email, u.full_name, u.password_hash,
                   u.role_id, r.role_name, r.permissions
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            WHERE u.email = %s AND u.is_active = TRUE
        """, (email,)).fetchone()

        if not row:
            return None

        # Verify password
        if not verify_password(password, row[3]):
            return None

        # Update last_login
        conn.execute("""
            UPDATE users SET last_login = NOW()
            WHERE user_id = %s
        """, (row[0],))
        conn.commit()

        return {
            "user_id": row[0],
            "email": row[1],
            "full_name": row[2],
            "role_id": row[4],
            "role_name": row[5],
            "permissions": row[6]
        }


def get_current_user(authorization: Optional[str] = Header(None)) -> CurrentUser:
    """
    Extract and validate JWT token from Authorization header.

    Dependency function for FastAPI routes requiring authentication.

    Args:
        authorization: Authorization header value (Bearer <token>)

    Returns:
        CurrentUser object with user details and permissions

    Raises:
        HTTPException: If authentication fails
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.replace("Bearer ", "")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fetch current user data from database
    with get_connection() as conn:
        row = conn.execute("""
            SELECT u.user_id, u.email, u.full_name, u.role_id,
                   r.role_name, r.permissions
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            WHERE u.user_id = %s AND u.is_active = TRUE
        """, (user_id,)).fetchone()

        if not row:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )

        return CurrentUser(
            user_id=row[0],
            email=row[1],
            full_name=row[2],
            role_id=row[3],
            role_name=row[4],
            permissions=row[5]
        )


def require_permission(permission: str):
    """
    Dependency function to enforce specific permission requirements.

    Usage:
        @router.post("/corrections/{id}/approve")
        async def approve_correction(
            correction_id: str,
            user: CurrentUser = Depends(require_permission("can_approve_corrections"))
        ):
            ...

    Args:
        permission: Permission key to check (e.g., "can_approve_corrections")

    Returns:
        Dependency function that validates permission
    """
    def permission_checker(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if not user.permissions.get(permission, False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission} required. Your role ({user.role_name}) does not have this permission."
            )
        return user
    return permission_checker


# Optional dependency - returns None if not authenticated
def get_current_user_optional(authorization: Optional[str] = Header(None)) -> Optional[CurrentUser]:
    """
    Optional authentication dependency.

    Returns CurrentUser if authenticated, None otherwise.
    Useful for endpoints that behave differently for authenticated users
    but don't strictly require authentication.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None

    try:
        return get_current_user(authorization)
    except HTTPException:
        return None
