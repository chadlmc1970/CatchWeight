"""Schema introspection API for database viewer."""

from fastapi import APIRouter, HTTPException
from catchweight.db import get_connection
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()


class TableInfo(BaseModel):
    table_name: str
    row_count: int
    description: Optional[str] = None


class ColumnInfo(BaseModel):
    column_name: str
    data_type: str
    is_nullable: str
    column_default: Optional[str]
    ordinal_position: int
    is_primary_key: bool


class ForeignKeyInfo(BaseModel):
    column_name: str
    referenced_table: str
    referenced_column: str
    constraint_name: str


class ReferencedByInfo(BaseModel):
    table_name: str
    column_name: str
    constraint_name: str


class IndexInfo(BaseModel):
    index_name: str
    columns: List[str]
    is_unique: bool


class TableDetail(BaseModel):
    table_name: str
    columns: List[ColumnInfo]
    primary_keys: List[str]
    foreign_keys: List[ForeignKeyInfo]
    referenced_by: List[ReferencedByInfo]
    indexes: List[IndexInfo]


class TablesResponse(BaseModel):
    tables: List[TableInfo]


@router.get("/schema/tables", response_model=TablesResponse)
def get_tables():
    """Get list of all tables in sap_poc schema."""
    try:
        with get_connection() as conn:
            # Get table names with descriptions
            tables_query = """
                SELECT
                    table_name,
                    obj_description((table_schema||'.'||table_name)::regclass, 'pg_class') as description
                FROM information_schema.tables
                WHERE table_schema = 'sap_poc'
                    AND table_type = 'BASE TABLE'
                ORDER BY table_name
            """
            cursor = conn.execute(tables_query)
            tables_data = cursor.fetchall()

            # Get row counts for each table
            tables = []
            for row in tables_data:
                table_name = row[0]
                description = row[1]

                # Get row count
                count_query = f"SELECT COUNT(*) FROM sap_poc.{table_name}"
                count_result = conn.execute(count_query).fetchone()
                row_count = count_result[0] if count_result else 0

                tables.append(TableInfo(
                    table_name=table_name,
                    row_count=row_count,
                    description=description
                ))

            return TablesResponse(tables=tables)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tables: {str(e)}")


@router.get("/schema/tables/{table_name}", response_model=TableDetail)
def get_table_detail(table_name: str):
    """Get detailed schema information for a specific table."""
    try:
        with get_connection() as conn:
            # Verify table exists
            table_check = conn.execute(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'sap_poc' AND table_name = %s",
                (table_name,)
            ).fetchone()

            if not table_check or table_check[0] == 0:
                raise HTTPException(status_code=404, detail=f"Table {table_name} not found")

            # Get columns with PK information
            columns_query = """
                SELECT
                    c.column_name,
                    c.data_type,
                    c.is_nullable,
                    c.column_default,
                    c.ordinal_position,
                    CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key
                FROM information_schema.columns c
                LEFT JOIN (
                    SELECT kcu.column_name
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu
                        ON tc.constraint_name = kcu.constraint_name
                        AND tc.table_schema = kcu.table_schema
                    WHERE tc.table_schema = 'sap_poc'
                        AND tc.table_name = %s
                        AND tc.constraint_type = 'PRIMARY KEY'
                ) pk ON c.column_name = pk.column_name
                WHERE c.table_schema = 'sap_poc'
                    AND c.table_name = %s
                ORDER BY c.ordinal_position
            """
            columns_result = conn.execute(columns_query, (table_name, table_name)).fetchall()

            columns = [
                ColumnInfo(
                    column_name=row[0],
                    data_type=row[1],
                    is_nullable=row[2],
                    column_default=row[3],
                    ordinal_position=row[4],
                    is_primary_key=row[5]
                )
                for row in columns_result
            ]

            # Extract primary key column names
            primary_keys = [col.column_name for col in columns if col.is_primary_key]

            # Get foreign keys (outgoing)
            fk_query = """
                SELECT
                    kcu.column_name,
                    ccu.table_name AS referenced_table,
                    ccu.column_name AS referenced_column,
                    tc.constraint_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage ccu
                    ON ccu.constraint_name = tc.constraint_name
                    AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                    AND tc.table_schema = 'sap_poc'
                    AND tc.table_name = %s
                ORDER BY kcu.column_name
            """
            fk_result = conn.execute(fk_query, (table_name,)).fetchall()

            foreign_keys = [
                ForeignKeyInfo(
                    column_name=row[0],
                    referenced_table=row[1],
                    referenced_column=row[2],
                    constraint_name=row[3]
                )
                for row in fk_result
            ]

            # Get referenced by (incoming FKs)
            referenced_by_query = """
                SELECT DISTINCT
                    tc.table_name,
                    kcu.column_name,
                    tc.constraint_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage ccu
                    ON ccu.constraint_name = tc.constraint_name
                    AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                    AND tc.table_schema = 'sap_poc'
                    AND ccu.table_name = %s
                ORDER BY tc.table_name, kcu.column_name
            """
            ref_by_result = conn.execute(referenced_by_query, (table_name,)).fetchall()

            referenced_by = [
                ReferencedByInfo(
                    table_name=row[0],
                    column_name=row[1],
                    constraint_name=row[2]
                )
                for row in ref_by_result
            ]

            # Get indexes
            indexes_query = """
                SELECT
                    i.relname as index_name,
                    array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum)) as columns,
                    ix.indisunique as is_unique
                FROM pg_class t
                JOIN pg_index ix ON t.oid = ix.indrelid
                JOIN pg_class i ON i.oid = ix.indexrelid
                JOIN pg_attribute a ON a.attrelid = t.oid
                JOIN pg_namespace n ON t.relnamespace = n.oid
                WHERE t.relname = %s
                    AND n.nspname = 'sap_poc'
                    AND a.attnum = ANY(ix.indkey)
                GROUP BY i.relname, ix.indisunique
                ORDER BY i.relname
            """
            indexes_result = conn.execute(indexes_query, (table_name,)).fetchall()

            indexes = [
                IndexInfo(
                    index_name=row[0],
                    columns=row[1],
                    is_unique=row[2]
                )
                for row in indexes_result
            ]

            return TableDetail(
                table_name=table_name,
                columns=columns,
                primary_keys=primary_keys,
                foreign_keys=foreign_keys,
                referenced_by=referenced_by,
                indexes=indexes
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching table details: {str(e)}")
