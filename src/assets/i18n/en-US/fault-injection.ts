export default {
  Namespace: 'Namespace',
  FaultLibrary: 'Faults',
  FaultCategory: 'Category',
  AvailableFaults: 'Available faults',
  NoFaultsInCategory: 'No injectable faults in this category',
  ThisWeek: 'This week',
  WeekView: 'Week view',
  Calendar: {
    Date: 'Date',
    Week: 'Week'
  },
  CategoryOptions: {
    pod: 'Pod',
    service: 'Service'
  },
  InjectionDialog: {
    Experiment: 'Experiment',
    Schedule: 'Schedule',
    Single: 'Single time, select the fault injection time',
    Timer: 'Timer, crontab expression, Beijing time, 10 5 * * *',
    SelectInjectionTiming: 'Select injection timing',
    Cancel: 'Cancel',
    Confirm: 'Confirm',
    Injection: 'Inject fault'
  },
  SelectFault: 'Select fault',
  Question:{
    Q1:  '1. While holding down V, scroll up (down) or press+(-) to vertically zoom in (down) on the calendar',
    Q2:  '2. While holding down H, scroll up (down) or press+(-) to horizontally zoom in (down) on the calendar',
    Q3:  '3. Drag the scrollbar or scroll wheel, or hold down the calendar and move the mouse to move the calendar'
  },
  AllFaultsAreLoaded: 'All faults are loaded',
  LoadingDates: 'Loading dates',
  RenderingCompleted: 'Rendering completed',
  ErrorDates: 'Error dates',
  DetailDialog: {
    FaultDetail: 'Fault Detail',
    Category: 'Category',
    Delete: 'Delete',
    Name: 'Name',
    Timestamp: 'Timestamp',
    Duration: 'Duration',
    Cancel: 'Cancel',
    Warning: 'Warning',
    DeletePromptPrefix: 'Are you sure you want to',
    DeletePromptSuffix: 'fault',
    Q: '?',
    Ongoing: 'Do not delete ongoing faults'
  },
  PleaseSelectANamespace: {
    Microservice: 'Microservice',
    Testbed: 'Testbed',
    Or: 'or',
    PLSGoto: 'Please goto',
    LastS: 'to create a testbed and obtain the namespace'
  }
}
