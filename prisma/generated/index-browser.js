
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.TokenScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  refreshToken: 'refreshToken',
  accessToken: 'accessToken',
  expiresAt: 'expiresAt'
};

exports.Prisma.OrganizationScalarFieldEnum = {
  id: 'id',
  name: 'name',
  address: 'address',
  contact: 'contact',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.BranchScalarFieldEnum = {
  id: 'id',
  name: 'name',
  organizationId: 'organizationId',
  address: 'address',
  contact: 'contact',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  name: 'name',
  contactNo: 'contactNo',
  identityNo: 'identityNo',
  avatar: 'avatar',
  password: 'password',
  email: 'email',
  role: 'role',
  branchId: 'branchId',
  organizationId: 'organizationId',
  identityImage: 'identityImage',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.PatientScalarFieldEnum = {
  id: 'id',
  name: 'name',
  contactNumber: 'contactNumber',
  idCardNo: 'idCardNo',
  email: 'email',
  dateOfBirth: 'dateOfBirth',
  address: 'address',
  medicalHistory: 'medicalHistory',
  allergies: 'allergies',
  branchId: 'branchId',
  patientType: 'patientType',
  createdById: 'createdById',
  updatedById: 'updatedById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.AppointmentScalarFieldEnum = {
  id: 'id',
  patientId: 'patientId',
  doctorId: 'doctorId',
  receptionistId: 'receptionistId',
  appointmentDate: 'appointmentDate',
  appointmentTime: 'appointmentTime',
  type: 'type',
  status: 'status',
  isFinalAppointment: 'isFinalAppointment',
  treatmentPlan: 'treatmentPlan',
  createdById: 'createdById',
  updatedById: 'updatedById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.TreatmentScalarFieldEnum = {
  id: 'id',
  treatmentName: 'treatmentName',
  description: 'description',
  baseCost: 'baseCost',
  duration: 'duration',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.PatientTreatmentScalarFieldEnum = {
  id: 'id',
  patientId: 'patientId',
  treatmentId: 'treatmentId',
  appointmentId: 'appointmentId',
  sessionNumber: 'sessionNumber',
  treatmentDate: 'treatmentDate',
  actualCost: 'actualCost',
  doctorId: 'doctorId',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.PatientBillScalarFieldEnum = {
  id: 'id',
  patientId: 'patientId',
  treatmentId: 'treatmentId',
  totalAmount: 'totalAmount',
  paidAmount: 'paidAmount',
  remainingAmount: 'remainingAmount',
  status: 'status'
};

exports.Prisma.PaymentScalarFieldEnum = {
  id: 'id',
  billId: 'billId',
  amount: 'amount',
  paymentDate: 'paymentDate',
  paymentMethod: 'paymentMethod',
  status: 'status',
  receivedById: 'receivedById',
  patientId: 'patientId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ExpenseScalarFieldEnum = {
  id: 'id',
  branchId: 'branchId',
  organizationId: 'organizationId',
  expenseName: 'expenseName',
  expenseType: 'expenseType',
  amount: 'amount',
  date: 'date',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.SalaryScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  branchId: 'branchId',
  salaryMonth: 'salaryMonth',
  amount: 'amount',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.BranchInventoryScalarFieldEnum = {
  id: 'id',
  branchId: 'branchId',
  itemName: 'itemName',
  currentQuantity: 'currentQuantity',
  reorderLevel: 'reorderLevel',
  costPerUnit: 'costPerUnit',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.InventoryOrderScalarFieldEnum = {
  id: 'id',
  branchId: 'branchId',
  itemName: 'itemName',
  quantityOrdered: 'quantityOrdered',
  costPerUnit: 'costPerUnit',
  totalCost: 'totalCost',
  supplier: 'supplier',
  receiptFilePath: 'receiptFilePath',
  orderedAt: 'orderedAt',
  receivedById: 'receivedById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.LogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  branchId: 'branchId',
  organizationId: 'organizationId',
  activity: 'activity',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.TokenOrderByRelevanceFieldEnum = {
  id: 'id',
  refreshToken: 'refreshToken',
  accessToken: 'accessToken'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.OrganizationOrderByRelevanceFieldEnum = {
  name: 'name',
  address: 'address',
  contact: 'contact'
};

exports.Prisma.BranchOrderByRelevanceFieldEnum = {
  name: 'name',
  address: 'address',
  contact: 'contact'
};

exports.Prisma.UserOrderByRelevanceFieldEnum = {
  name: 'name',
  contactNo: 'contactNo',
  identityNo: 'identityNo',
  avatar: 'avatar',
  password: 'password',
  email: 'email',
  identityImage: 'identityImage'
};

exports.Prisma.PatientOrderByRelevanceFieldEnum = {
  name: 'name',
  contactNumber: 'contactNumber',
  idCardNo: 'idCardNo',
  email: 'email',
  address: 'address',
  medicalHistory: 'medicalHistory',
  allergies: 'allergies'
};

exports.Prisma.AppointmentOrderByRelevanceFieldEnum = {
  treatmentPlan: 'treatmentPlan'
};

exports.Prisma.TreatmentOrderByRelevanceFieldEnum = {
  treatmentName: 'treatmentName',
  description: 'description'
};

exports.Prisma.ExpenseOrderByRelevanceFieldEnum = {
  expenseName: 'expenseName',
  description: 'description'
};

exports.Prisma.BranchInventoryOrderByRelevanceFieldEnum = {
  itemName: 'itemName'
};

exports.Prisma.InventoryOrderOrderByRelevanceFieldEnum = {
  itemName: 'itemName',
  supplier: 'supplier',
  receiptFilePath: 'receiptFilePath'
};

exports.Prisma.LogOrderByRelevanceFieldEnum = {
  activity: 'activity'
};
exports.BranchStatus = exports.$Enums.BranchStatus = {
  active: 'active',
  inactive: 'inactive'
};

exports.Role = exports.$Enums.Role = {
  doctor: 'doctor',
  receptionist: 'receptionist',
  branch_admin: 'branch_admin',
  organization_admin: 'organization_admin'
};

exports.PatientType = exports.$Enums.PatientType = {
  walk_in: 'walk_in',
  regular: 'regular',
  appointed: 'appointed'
};

exports.AppointmentType = exports.$Enums.AppointmentType = {
  scheduled: 'scheduled',
  walk_in: 'walk_in'
};

exports.AppointmentStatus = exports.$Enums.AppointmentStatus = {
  scheduled: 'scheduled',
  expired: 'expired',
  waiting: 'waiting',
  completed: 'completed',
  cancelled: 'cancelled',
  rescheduled: 'rescheduled'
};

exports.TreatmentStatus = exports.$Enums.TreatmentStatus = {
  pending: 'pending',
  in_progress: 'in_progress',
  completed: 'completed'
};

exports.BillStatus = exports.$Enums.BillStatus = {
  paid: 'paid',
  partially_paid: 'partially_paid',
  pending: 'pending'
};

exports.PaymentMethod = exports.$Enums.PaymentMethod = {
  cash: 'cash',
  card: 'card',
  online: 'online'
};

exports.PaymentStatus = exports.$Enums.PaymentStatus = {
  paid: 'paid',
  pending: 'pending'
};

exports.ExpenseType = exports.$Enums.ExpenseType = {
  rent: 'rent',
  salaries: 'salaries',
  utilities: 'utilities',
  inventory: 'inventory',
  other: 'other'
};

exports.SalaryStatus = exports.$Enums.SalaryStatus = {
  paid: 'paid',
  unpaid: 'unpaid'
};

exports.Prisma.ModelName = {
  Token: 'Token',
  Organization: 'Organization',
  Branch: 'Branch',
  User: 'User',
  Patient: 'Patient',
  Appointment: 'Appointment',
  Treatment: 'Treatment',
  PatientTreatment: 'PatientTreatment',
  PatientBill: 'PatientBill',
  Payment: 'Payment',
  Expense: 'Expense',
  Salary: 'Salary',
  BranchInventory: 'BranchInventory',
  InventoryOrder: 'InventoryOrder',
  Log: 'Log'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
