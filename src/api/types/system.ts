export interface MaintenanceWindowView {
  id: string;
  startsAt: string;
  endsAt: string;
  messageEn: string;
  messageAr: string;
  readOnly: boolean;
  active: boolean;
}

export interface SystemStatus {
  version: string;
  serverTime: string;
  readOnly: boolean;
  maintenance: MaintenanceWindowView[];
}
