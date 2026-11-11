export interface AuthenticatedUser {
  id: string;
  branchId: string;
  role: {
    permissions: string[];
    dataScope: 'own' | 'branch' | 'all';
  };
}