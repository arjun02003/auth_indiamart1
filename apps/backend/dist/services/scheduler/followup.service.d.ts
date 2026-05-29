declare class FollowUpScheduler {
    private job;
    start(): void;
    stop(): void;
    processFollowUps(): Promise<void>;
    private sendFollowUp;
    private createScheduledFollowUps;
    private markInactiveLeads;
}
export declare const followUpScheduler: FollowUpScheduler;
export {};
//# sourceMappingURL=followup.service.d.ts.map