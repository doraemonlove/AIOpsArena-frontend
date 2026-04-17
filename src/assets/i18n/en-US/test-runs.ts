export default {
  Title: 'Test Runs',
  Description: 'Track inference jobs, inspect run details, review logs, and manage test workflows.',
  CreateTest: 'Create Test',
  Refresh: 'Refresh',
  Empty: 'No test runs yet.',
  Filter: {
    Type: 'Algorithm Type',
    Status: 'Status',
    All: 'All',
    Search: 'Search by algorithm or dataset'
  },
  Table: {
    Id: 'ID',
    AlgorithmName: 'Algorithm Name',
    AlgorithmType: 'Algorithm Type',
    SourceRunId: 'Source Run ID',
    DatasetName: 'Dataset Name',
    OwnerName: 'Owner',
    Status: 'Status',
    EvaluationStatus: 'Evaluation',
    ErrorMessage: 'Error Message',
    CreatedAt: 'Created At',
    StartedAt: 'Started At',
    FinishedAt: 'Finished At',
    Actions: 'Actions'
  },
  StatusText: {
    waiting: 'waiting',
    starting: 'starting',
    running: 'running',
    finished: 'finished',
    failed: 'failed',
    canceled: 'canceled'
  },
  EvaluationStatus: {
    pending: 'pending',
    success: 'success',
    failed: 'failed',
    skipped: 'skipped'
  },
  Deleted: 'deleted',
  Actions: {
    Detail: 'Detail',
    Rerun: 'Rerun',
    Delete: 'Delete',
    CancelTask: 'Cancel Run',
    Close: 'Close'
  },
  Create: {
    Title: 'Create Test',
    AlgorithmType: 'Algorithm Type',
    AlgorithmTypePlaceholder: 'Select algorithm type',
    SourceRun: 'Source Train Run',
    SourceRunPlaceholder: 'Select a finished train run',
    Dataset: 'Dataset',
    DatasetPlaceholder: 'Select dataset',
    Config: 'Algorithm Config (JSON)',
    Mode: 'Mode',
    Test: 'test'
  },
  Detail: {
    Title: 'Test Detail',
    Empty: 'No detail available.',
    BasicInfo: 'Basic Info',
    Logs: 'Logs'
  },
  Log: {
    Empty: 'No log content.'
  },
  Confirm: {
    DeleteTitle: 'Delete Test Run',
    DeleteContent: 'Delete test run #{id}?',
    CancelTitle: 'Cancel Test Run',
    CancelContent: 'Cancel test run #{id}?',
    Confirm: 'Confirm',
    Cancel: 'Cancel'
  },
  Message: {
    LoadFailed: 'Failed to load test runs',
    CreateSuccess: 'Test created',
    CreateFailed: 'Failed to create test',
    DeleteSuccess: 'Test run deleted',
    DeleteFailed: 'Failed to delete test run',
    CancelSuccess: 'Test run canceled',
    CancelFailed: 'Failed to cancel test run',
    PermissionDenied: 'Only the owner can perform this action',
    RerunSuccess: 'Test rerun created',
    RerunFailed: 'Failed to rerun test',
    DetailFailed: 'Failed to load test detail',
    LogFailed: 'Failed to load test log',
    ConfigInvalid: 'Algorithm config must be valid JSON',
    SourceRunRequired: 'Please select a source train run',
    DatasetRequired: 'Please select a dataset'
  }
}
