import { PoolClient } from "pg";

export const insertOrUpdateMapTag = async (
    dataOJB: { epc: string; tag: string; status: string },
    transaction: PoolClient
) => {
    const upsertSql = `
        INSERT INTO map_tag (epc, tag, status)
        VALUES ($1, $2, $3)
        ON CONFLICT (epc) DO UPDATE
        SET is_delete = FALSE
                    RETURNING *;
                `;
    const upsertRes = await transaction.query(upsertSql, [
        dataOJB.epc,
        dataOJB.tag,
        dataOJB.status
    ]);
    return { success: true, status: 200, data: upsertRes.rows[0] };
};
