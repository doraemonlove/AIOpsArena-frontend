export default {
  Title: 'Algorithm Management',
  Description:
    'Manage public and private algorithm templates, track import and image build progress, and keep template assets organized by algorithm type.',
  UploadAlgorithm: 'Upload Algorithm',
  DownloadTemplate: 'Download Template',
  Refresh: 'Refresh',
  PublicAlgorithms: 'Public Algorithms',
  PrivateAlgorithms: 'Private Algorithms',
  NoPublicAlgorithms: 'No public algorithms yet.',
  NoPrivateAlgorithms: 'No private algorithms yet.',
  AlgorithmsCount: '{count} algorithms',
  ItemsCount: '{count} items',
  ItemCount: '{count} item',
  Table: {
    AlgorithmName: 'Algorithm Name',
    AlgorithmType: 'Algorithm Type',
    Description: 'Description',
    Owner: 'Owner',
    Visibility: 'Visibility',
    Status: 'Status',
    ImageStatus: 'Image Status',
    CreatedAt: 'Created At',
    Operations: 'Operations'
  },
  Visibility: {
    Public: 'public',
    Private: 'private'
  },
  Filter: {
    Type: 'Filter by Type',
    All: 'All'
  },
  StatusText: {
    importing: 'importing',
    ready: 'ready',
    failed: 'failed',
    building: 'building',
    not_built: 'not built'
  },
  Actions: {
    MakePublic: 'Make Public',
    MakePrivate: 'Make Private',
    BuildImage: 'Build Image',
    Delete: 'Delete',
    Cancel: 'Cancel'
  },
  Upload: {
    Title: 'Upload Algorithm',
    AlgorithmName: 'Algorithm Name',
    AlgorithmNamePlaceholder: 'Enter algorithm name',
    AlgorithmType: 'Algorithm Type',
    AlgorithmTypePlaceholder: 'Select algorithm type',
    DatasetType: 'Dataset Type',
    Visibility: 'Visibility',
    Public: 'Public',
    Private: 'Private',
    File: 'Algorithm File',
    FilePlaceholder: 'Drop file here or click to select',
    Submit: 'Upload Algorithm',
    Validation: {
      NameRequired: 'Please input algorithm name',
      TypeRequired: 'Please select algorithm type',
      DatasetTypeRequired: 'Please select at least one dataset type',
      FileRequired: 'Please choose an algorithm file'
    }
  },
  Message: {
    LoadFailed: 'Failed to load algorithms',
    FetchImportStatusFailed: 'Failed to fetch import status',
    FetchImageStatusFailed: 'Failed to fetch image build status',
    UploadStarted: 'Algorithm upload started',
    UploadFailed: 'Failed to upload algorithm',
    BuildStarted: 'Image build started',
    BuildFailed: 'Failed to build image',
    PermissionDenied: 'Only the owner can perform this action',
    ToggleVisibilitySuccess: 'Algorithm visibility updated',
    ToggleVisibilityFailed: 'Failed to update algorithm visibility',
    DownloadTemplateFailed: 'Failed to download template',
    DeleteSuccess: 'Algorithm deleted',
    DeleteFailed: 'Failed to delete algorithm'
  },
  DeleteDialog: {
    Title: 'Delete Algorithm',
    Content: 'Delete algorithm "{name}"?',
    Confirm: 'Delete',
    Cancel: 'Cancel'
  }
}
