export default {
  Title: 'Train Runs',
  Description: 'Track training jobs, inspect run details, review logs, and manage active train workflows.',
  CreateTrain: 'Create Train',
  Refresh: 'Refresh',
  Empty: 'No train runs yet.',
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
    DatasetName: 'Dataset Name',
    OwnerName: 'Owner',
    Status: 'Status',
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
  Deleted: 'deleted',
  Actions: {
    Detail: 'Detail',
    Rerun: 'Rerun',
    Delete: 'Delete',
    CancelTask: 'Cancel Run',
    Close: 'Close',
    Submit: 'Submit'
  },
  Create: {
    Title: 'Create Train',
    AlgorithmType: 'Algorithm Type',
    AlgorithmTypePlaceholder: 'Select algorithm type',
    AlgorithmTemplate: 'Algorithm Template',
    AlgorithmTemplatePlaceholder: 'Select algorithm template',
    Dataset: 'Dataset',
    DatasetPlaceholder: 'Select dataset',
    Config: 'Algorithm Config (JSON)',
    ConfigPlaceholder: '{\n  "lr": 0.01,\n  "epochs": 10\n}',
    Mode: 'Mode',
    Train: 'train'
  },
  Detail: {
    Title: 'Train Detail',
    Empty: 'No detail available.',
    BasicInfo: 'Basic Info',
    Logs: 'Logs'
  },
  Log: {
    Empty: 'No log content.'
  },
  Confirm: {
    DeleteTitle: 'Delete Train Run',
    DeleteContent: 'Delete train run #{id}?',
    CancelTitle: 'Cancel Train Run',
    CancelContent: 'Cancel train run #{id}?',
    Confirm: 'Confirm',
    Cancel: 'Cancel'
  },
  Message: {
    LoadFailed: 'Failed to load train runs',
    CreateSuccess: 'Train created',
    CreateFailed: 'Failed to create train',
    DeleteSuccess: 'Train run deleted',
    DeleteFailed: 'Failed to delete train run',
    CancelSuccess: 'Train canceled',
    CancelFailed: 'Failed to cancel train',
    PermissionDenied: 'Only the owner can perform this action',
    RerunSuccess: 'Train rerun created',
    RerunFailed: 'Failed to rerun train',
    DetailFailed: 'Failed to load train detail',
    ConfigInvalid: 'Algorithm config must be valid JSON',
    AlgorithmRequired: 'Please select an algorithm template',
    DatasetRequired: 'Please select a dataset'
  }
}
