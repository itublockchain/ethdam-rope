export interface TransactionRequest {
    amount: number;
    bankAccountNumber: string;
    walletAddress: string;
    name?: string;
    sortCode?: string;
}
