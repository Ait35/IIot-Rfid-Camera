import { getAccountsFilteredPage } from '../../Repository/ReadQuery/Read.Account.Query.js';

export const AccountRead = {
    async get_accounts(
        page: number,
        limit: number,
        role?: string,
        search?: string,
        is_delete: boolean = false,
        start_date?: string,
        end_date?: string
    ) {
        console.log('----- API action: get_accounts -----');
        return await getAccountsFilteredPage(page, limit, role, search, is_delete, start_date, end_date);
    }
};
