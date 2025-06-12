# MedRemind Hub - Comprehensive Patient Management System

A modern, HIPAA-compliant patient management system with advanced RUD (Read, Update, Delete) operations, built with React, TypeScript, and Supabase.

## 🚀 Features

### Core Functionality
- **Patient Management**: Complete CRUD operations with soft delete and restore capabilities
- **Appointment Scheduling**: Schedule and manage patient appointments with reminder system
- **Medical Records**: Comprehensive medical history, medications, allergies, and insurance tracking
- **Document Management**: Secure file upload and storage for patient documents
- **Advanced Search**: Full-text search with filtering, sorting, and pagination
- **Audit Trail**: Complete audit logging for all patient record changes

### Security & Compliance
- **HIPAA Compliance**: Built with healthcare data protection standards
- **Row Level Security (RLS)**: Database-level access control
- **Input Validation**: Comprehensive data validation and sanitization
- **Soft Delete**: Data preservation with restore functionality
- **Audit Logging**: Complete change tracking and user activity logs

### Advanced Features
- **Real-time Updates**: Live data synchronization
- **Responsive Design**: Mobile-first, accessible interface
- **Bilingual Support**: English and Tamil language support
- **Export Capabilities**: Data export for reporting and backup
- **Advanced Filtering**: Multi-criteria search and filtering
- **Pagination**: Efficient handling of large datasets

## 🏗️ Architecture

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Custom hooks** for state management
- **Component-based architecture** with clear separation of concerns

### Backend
- **Supabase** for database and authentication
- **PostgreSQL** with Row Level Security
- **Real-time subscriptions** for live updates
- **Edge Functions** for serverless operations
- **Storage** for file management

### Database Schema
```sql
-- Core Tables
patients              -- Patient demographics and contact info
medical_history       -- Medical conditions and diagnoses
medications          -- Current and past medications
allergies            -- Patient allergies and reactions
insurance_billing    -- Insurance and billing information
patient_documents    -- Uploaded documents and files
appointments         -- Scheduled appointments

-- Audit & Management
patient_audit_log    -- Complete audit trail
deleted_patients     -- Soft delete backup storage
```

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd medremind-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Add your Supabase credentials
   ```

4. **Run database migrations**
   ```bash
   # Apply the migration files in supabase/migrations/
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 📊 Database Setup

### Required Tables
Run the migration files in order:
1. `create_patient_management_tables.sql` - Core tables and audit system
2. Apply RLS policies for security
3. Set up storage bucket for documents

### Storage Configuration
- Bucket name: `patientdocuments`
- Path structure: `{user_id}/{patient_id}/{document_type}/{filename}`
- Policies: Authenticated users can manage their own documents

## 🔍 API Documentation

### Patient Search API
```typescript
// Search patients with advanced filters
const result = await searchPatients(userId, {
  searchTerm: 'John Doe',
  gender: 'ஆண்',
  preferredContactMethod: 'Email',
  ageRange: { min: 18, max: 65 },
  sortBy: 'name',
  sortOrder: 'asc',
  limit: 20,
  offset: 0
});
```

### Patient Management API
```typescript
// Create patient
const patient = await createPatient(patientData, userId);

// Update patient
const updated = await updatePatient(patientId, updateData, userId);

// Soft delete patient
await softDeletePatient(patientId, userId, 'Reason for deletion');

// Restore deleted patient
await restorePatient(deletedPatientId, userId);
```

### Audit Trail API
```typescript
// Get audit trail for patient
const auditTrail = await getPatientAuditTrail(patientId, userId);

// Get deleted patients
const deletedPatients = await getDeletedPatients(userId);
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suite
npm test -- patientRUD.test.ts

# Run tests with coverage
npm run test:coverage
```

### Test Coverage
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API and database operation testing
- **Security Tests**: Access control and validation testing
- **Performance Tests**: Load and response time testing

## 🔒 Security Features

### Data Protection
- **Input Sanitization**: XSS prevention
- **SQL Injection Protection**: Parameterized queries
- **Access Control**: User-based data isolation
- **Audit Logging**: Complete change tracking

### HIPAA Compliance
- **Data Encryption**: In transit and at rest
- **Access Controls**: Role-based permissions
- **Audit Trails**: Complete activity logging
- **Data Retention**: Configurable retention policies

## 📱 User Interface

### Key Components
- **PatientSearchComponent**: Advanced search interface
- **PatientDeleteConfirmation**: Secure deletion workflow
- **DeletedPatientsManager**: Restore deleted records
- **PatientAuditTrail**: View change history
- **EnhancedPatientDetailsPage**: Complete patient management

### Responsive Design
- Mobile-first approach
- Accessible components
- Keyboard navigation support
- Screen reader compatibility

## 🌐 Deployment

### Production Deployment
```bash
# Build for production
npm run build

# Deploy to Netlify (configured)
# Automatic deployment on push to main branch
```

### Environment Configuration
- **Development**: Local Supabase instance
- **Staging**: Staging Supabase project
- **Production**: Production Supabase project with backups

## 📈 Performance Optimization

### Database Optimization
- **Indexes**: Optimized for search queries
- **RLS Policies**: Efficient row-level security
- **Connection Pooling**: Managed by Supabase
- **Query Optimization**: Efficient joins and filters

### Frontend Optimization
- **Code Splitting**: Lazy loading of components
- **Memoization**: React.memo and useMemo
- **Virtual Scrolling**: For large datasets
- **Image Optimization**: Compressed and responsive images

## 🔄 Data Flow

### Patient Operations
1. **Create**: Validate → Insert → Audit Log
2. **Read**: Search/Filter → Apply RLS → Return Results
3. **Update**: Validate → Update → Audit Log
4. **Delete**: Soft Delete → Backup → Audit Log
5. **Restore**: Validate → Restore → Audit Log

### Search Operations
1. **Input**: Search terms and filters
2. **Validation**: Sanitize and validate input
3. **Query**: Build optimized database query
4. **Results**: Apply pagination and return data

## 🛠️ Development Guidelines

### Code Standards
- **TypeScript**: Strict type checking
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Conventional Commits**: Standardized commit messages

### Component Structure
```
components/
├── shared/           # Reusable UI components
├── forms/           # Form components
└── modals/          # Modal dialogs

features/
├── patient-management/
│   ├── components/  # Feature-specific components
│   ├── hooks/       # Custom hooks
│   └── types/       # Type definitions

api/                 # API layer
utils/              # Utility functions
types/              # Global type definitions
```

## 📋 Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Write tests for new features**
4. **Ensure all tests pass**
5. **Submit a pull request**

### Development Workflow
1. **Issue Creation**: Document requirements
2. **Branch Creation**: Feature/fix branches
3. **Development**: Write code and tests
4. **Testing**: Comprehensive test coverage
5. **Review**: Code review process
6. **Deployment**: Automated deployment

## 📞 Support

For support and questions:
- **Documentation**: Check the inline code documentation
- **Issues**: Create GitHub issues for bugs
- **Security**: Report security issues privately

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Supabase**: Backend infrastructure
- **Tailwind CSS**: UI framework
- **React**: Frontend framework
- **TypeScript**: Type safety
- **Vite**: Build tool

---

**Note**: This system handles sensitive healthcare data. Ensure proper security measures and compliance with local healthcare regulations before deployment.