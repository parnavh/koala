export const ERROR_MESSAGES = {
  maintenance:
    "Maintenance is underway, Functionality may be limited\nInconvenience regretted!",
} as const;

export class MaintenanceError extends Error {
  constructor();
  constructor(message?: string) {
    super(message ?? ERROR_MESSAGES["maintenance"]);

    this.name = "MaintenanceError";
  }
}
