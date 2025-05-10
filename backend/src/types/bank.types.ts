export interface Response<T> {
  content: T;
}

export interface AdditionalInfo {
  payer: Payer;
}

export interface Payer {
  name: string;
  identifier: Identifier;
}

export interface Identifier {
  type: string;
  sortCode: string;
  accountNumber: string;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  transactionDate: Date;
  additionalInfo: AdditionalInfo;
}

export interface CreatePaymentRequest {
  sourceAccountId?: string;
  destination: Destination;
  currency?: string;
  amount: number;
  reference?: string;
}

export interface Destination{
  type: string;
  accountNumber: string;
  sortCode: string;
  name: string;
}

export interface CreatePaymentResponse {
  id: string;
  status: string;
}