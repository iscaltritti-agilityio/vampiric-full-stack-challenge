# 🧛‍♂️ Vampiric Full Stack Challenge

## Purpose

Welcome, mortal developer, to the Eternal Night Coding Challenge. You have been *chosen* to prove your worthiness to join our ancient coven of immortal programmers. Your task: debug and enhance our centuries-old codebase that manages our vampire operations.

**AI Usage Encouraged** - Even we vampires use familiar spirits and ancient AI oracles. Use whatever dark magic you need.

## Awakening the Beast

```bash
npm run setup
npm start
```

Enter our digital lair at: http://localhost:3000

## 🔒 Authentication

The application now requires vampire authentication to access ancient records:

**Secret Phrase:** `eternal darkness calls`

When you first access the application, you'll see an authentication form. Enter the secret phrase above to gain access to the vampire management system.

## 🕷️ Primary Objective: Pest Control (Bug Hunt)
*Our ancient codebase has been infected by mortal incompetence. Fix ALL of these issues:*

### Critical Bugs (Fix All)
- **B-1**: Profile update form doesn't save changes properly
- **B-2**: Blood sack recruitment button doesn't work
- **B-3**: Missing form validation allows invalid data entry

## 🎯 Secondary Objectives: Feature Enhancements 
*Choose from these additional improvements if time permits*

### 🩸 Blood Management Features
- **F-1**: Add sorting options for blood sacks (price, quality, last seen)
- **F-2**: Create feeding history display in vampire profile
- **F-3**: Add blood sack search by name functionality

### 🧛‍♂️ Profile & UI Enhancements
- **F-4**: Add profile picture upload functionality
- **F-5**: Implement better error handling and loading states
- **F-6**: Add confirmation dialogs for critical actions (feeding, recruitment)

### ⚡ Advanced Features
- **F-7**: Implement real-time updates for blood sack status changes
- **F-8**: Add authentication middleware to protect vampire endpoints
- **F-9**: Write unit tests for critical GraphQL mutations

## ✅ Implementation Status

All objectives have been completed successfully:

### Critical Bugs - **ALL FIXED ✅**
- ✅ **B-1**: Profile update form now saves changes properly
- ✅ **B-2**: Blood sack recruitment button works correctly  
- ✅ **B-3**: Comprehensive form validation implemented (client + server)

### Blood Management Features - **ALL IMPLEMENTED ✅**
- ✅ **F-1**: Sorting options for blood sacks (price, quality, last seen, age, name)
- ✅ **F-2**: Feeding history display with expandable timeline
- ✅ **F-3**: Real-time blood sack search by name functionality

### Profile & UI Enhancements - **ALL IMPLEMENTED ✅**
- ✅ **F-4**: Profile picture upload (base64, 2MB limit, validation)
- ✅ **F-5**: Error boundaries, loading spinners, better error messages
- ✅ **F-6**: Confirmation dialogs for feeding and recruitment actions

### Advanced Features - **ALL IMPLEMENTED ✅**
- ✅ **F-7**: Real-time updates via GraphQL refetchQueries
- ✅ **F-8**: Token-based authentication middleware protecting all vampire endpoints
- ✅ **F-9**: Comprehensive unit test suite (84 passing tests)

## 🧪 Testing

Run the complete test suite:

```bash
cd backend
npm test
```

**Test Results:** 84 tests passing across 5 test suites covering:
- GraphQL resolvers and mutations
- REST API endpoints
- Authentication middleware
- Integration workflows
- Utility functions and edge cases
