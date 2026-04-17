export default {
  Title: 'Leaderboard',
  Description: 'Manage batch evaluation records, filter by algorithm type, and inspect item-level metrics in one unified workspace.',
  Empty: 'No leaderboard records yet.',
  Filter: {
    All: 'All algorithm types',
    Search: 'Search by leaderboard name'
  },
  Table: {
    Id: 'ID',
    Name: 'Name',
    AlgorithmType: 'Algorithm Type',
    DatasetName: 'Dataset Name',
    RunCount: 'Run Count',
    Status: 'Status',
    Visibility: 'Visibility',
    OwnerName: 'Owner',
    CreatedAt: 'Created At',
    UpdatedAt: 'Updated At',
    Actions: 'Actions'
  },
  Status: {
    running: 'running',
    finished: 'finished',
    failed: 'failed'
  },
  Visibility: {
    Public: 'public',
    Private: 'private'
  },
  Actions: {
    Create: 'Create Leaderboard',
    Refresh: 'Refresh',
    Detail: 'Detail',
    Rerun: 'Rerun',
    Delete: 'Delete',
    DeleteItem: 'Delete Item',
    SetPublic: 'Set Public',
    SetPrivate: 'Set Private',
    Close: 'Close'
  },
  Create: {
    Title: 'Create Leaderboard',
    Name: 'Name',
    NamePlaceholder: 'Enter leaderboard name',
    AlgorithmType: 'Algorithm Type',
    AlgorithmTypePlaceholder: 'Select algorithm type',
    Dataset: 'Dataset',
    DatasetPlaceholder: 'Select dataset',
    Description: 'Description',
    DescriptionPlaceholder: 'Describe this leaderboard',
    Visibility: 'Visibility',
    SourceRuns: 'Source Train Runs',
    SourceRunsHint: 'Choose the train runs that should be included in this evaluation batch.',
    SourceRunsSearch: 'Search source runs',
    SelectedRuns: '{count} selected',
    NoSourceRuns: 'No available train runs for the selected algorithm type.',
    SourceRunTable: {
      Id: 'Run ID',
      AlgorithmName: 'Algorithm Name',
      DatasetName: 'Dataset Name',
      Status: 'Status',
      FinishedAt: 'Finished At'
    }
  },
  Detail: {
    Title: 'Leaderboard Detail',
    Empty: 'No detail available.',
    BasicInfo: 'Basic Info',
    ResultTitle: 'Leaderboard Result',
    ItemsTitle: 'Leaderboard Items',
    ItemsCount: '{count} items',
    NoItems: 'No evaluation items yet.',
    ResultTable: {
      AlgorithmName: 'Algorithm Name',
      EvaluationResult: 'Evaluation Result',
      NoMetrics: 'No Metrics'
    },
    Table: {
      ItemId: 'Item ID',
      AlgorithmName: 'Algorithm Name',
      SourceRunId: 'Source Run ID',
      TestRunId: 'Test Run ID',
      ItemStatus: 'Item Status',
      RunStatus: 'Run Status',
      EvaluationStatus: 'Evaluation Status',
      ErrorMessage: 'Error Message',
      EvaluationError: 'Evaluation Error',
      CreatedAt: 'Created At'
    }
  },
  Confirm: {
    DeleteTitle: 'Delete Leaderboard',
    DeleteContent: 'Delete leaderboard "#{id} {name}"?',
    DeleteItemTitle: 'Delete Evaluation Item',
    DeleteItemContent: 'Delete item "#{id} {name}" from this leaderboard?',
    RerunItemTitle: 'Rerun Evaluation Item',
    RerunItemContent: 'Rerun item "#{id} {name}" in this leaderboard?'
  },
  Message: {
    LoadFailed: 'Failed to load leaderboards',
    CreateSuccess: 'Leaderboard created',
    CreateFailed: 'Failed to create leaderboard',
    DeleteSuccess: 'Leaderboard deleted',
    DeleteFailed: 'Failed to delete leaderboard',
    DeleteItemSuccess: 'Evaluation item deleted',
    DeleteItemFailed: 'Failed to delete evaluation item',
    DetailFailed: 'Failed to load leaderboard detail',
    RerunSuccess: 'Evaluation item rerun created',
    RerunFailed: 'Failed to rerun evaluation item',
    ToggleVisibilitySuccess: 'Leaderboard visibility updated',
    ToggleVisibilityFailed: 'Failed to update leaderboard visibility',
    RerunUnavailable: 'This item has no reusable test run',
    AvailableRunsFailed: 'Failed to load available train runs',
    NameRequired: 'Please enter a leaderboard name',
    AlgorithmTypeRequired: 'Please select an algorithm type',
    DatasetRequired: 'Please select a dataset',
    SourceRunsRequired: 'Please select at least one source train run'
  }
}
