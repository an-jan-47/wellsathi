# Requirements Document: Unified Booking Flow Enhancement

## Introduction

This document specifies the requirements for enhancing the WellSathi booking flow to create a unified, streamlined user experience. The enhancement eliminates redundant doctor and time selection steps, consolidates the booking process from three steps to two, and improves mobile usability with better visual indicators and real-time validation.

The current booking flow requires users to select doctor, date, and time on the Clinic Profile page, then re-select the same information on the Book page (Step 1), creating a confusing and redundant experience. This enhancement removes that duplication and creates a single, consistent booking pattern across all entry points.

## Glossary

- **Booking_System**: The WellSathi appointment booking application
- **Clinic_Profile_Page**: The page displaying clinic information with the booking widget (`/clinic/:id`)
- **Book_Page**: The appointment booking page (`/book/:clinicId`)
- **Patient_Details_Page**: The second step of booking where patient information is collected
- **Booking_Widget**: The component on Clinic Profile that allows doctor/date/time selection
- **Booking_Summary**: The sidebar component showing appointment details and pricing
- **Time_Slot**: An available appointment time for a specific doctor on a specific date
- **Extra_Services**: Optional additional services that can be added to an appointment
- **Availability_Indicator**: Visual cue showing number of available slots for a date
- **Real_Time_Validation**: Form validation that occurs as the user types, not just on submit
- **Google_Calendar_Integration**: Feature allowing users to add confirmed appointments to Google Calendar
- **Appointment_Duration**: The length of time allocated for an appointment (e.g., 30 minutes, 1 hour)

## Requirements

### Requirement 1: Unified Booking Flow

**User Story:** As a patient, I want to select my doctor, date, and time once on the Clinic Profile page and proceed directly to patient details, so that I don't have to repeat my selections.

#### Acceptance Criteria

1. WHEN a user selects doctor, date, and time on THE Clinic_Profile_Page, THE Booking_System SHALL pass these selections to THE Book_Page via URL parameters
2. WHEN THE Book_Page receives doctor, date, and time parameters, THE Booking_System SHALL skip Step 1 and display THE Patient_Details_Page directly
3. THE Booking_System SHALL eliminate the "Select Appointment" step from THE Book_Page
4. WHEN a user clicks "Continue" on THE Booking_Widget, THE Booking_System SHALL navigate to THE Patient_Details_Page with pre-selected appointment details
5. THE Booking_System SHALL maintain a single source of truth for doctor/date/time selection on THE Clinic_Profile_Page

### Requirement 2: Enhanced Doctor Selection on Clinic Profile

**User Story:** As a patient, I want to clearly see which doctor I have selected on the Clinic Profile page, so that I know who my appointment will be with before proceeding.

#### Acceptance Criteria

1. THE Booking_Widget SHALL display doctor selection as the first and most prominent element
2. WHEN a doctor is selected, THE Booking_Widget SHALL show a clear visual indication with a highlighted border and checkmark
3. THE Booking_Widget SHALL display doctor cards with name, specialization, experience, and consultation fee
4. WHEN no doctor is selected, THE Booking_Widget SHALL default to the first available doctor
5. THE Booking_Widget SHALL update available time slots immediately when a different doctor is selected

### Requirement 3: Availability Indicators

**User Story:** As a patient, I want to see how many appointment slots are available for each date, so that I can choose a date with good availability.

#### Acceptance Criteria

1. WHEN THE Booking_Widget displays date options, THE Booking_System SHALL show the number of available slots below each date button
2. THE Booking_System SHALL display availability indicators as text (e.g., "5 slots available") or visual dots
3. WHEN a date has zero available slots, THE Booking_System SHALL display "No slots" and disable the date button
4. THE Booking_System SHALL update availability indicators in real-time when a different doctor is selected
5. WHERE the viewport is mobile, THE Booking_System SHALL display availability indicators with appropriate sizing for touch targets (minimum 44x44 pixels)
6. THE Booking_System SHALL calculate availability by counting time slots where `is_available = true` for the selected doctor and date

### Requirement 4: Services in Patient Details

**User Story:** As a patient, I want to select extra services while filling out my patient information, so that I can see all my choices together before confirming.

#### Acceptance Criteria

1. THE Booking_System SHALL move the "Extra Services" section from Step 1 to THE Patient_Details_Page
2. THE Patient_Details_Page SHALL display extra services with checkboxes, service names, and individual fees
3. THE Booking_Summary SHALL display all selected services with their names and prices
4. WHEN a service is selected or deselected, THE Booking_Summary SHALL update the total fee immediately
5. THE Booking_Summary SHALL show a clear breakdown: consultation fee + service fees = total fee
6. THE Booking_Summary SHALL format prices with the rupee symbol (₹) and proper number formatting

### Requirement 5: Appointment Duration Display

**User Story:** As a patient, I want to see how long my appointment will last, so that I can plan my schedule accordingly.

#### Acceptance Criteria

1. THE Booking_Summary SHALL display appointment duration prominently (e.g., "30 minutes", "1 hour")
2. THE Booking_Widget SHALL show duration next to each time slot selection
3. THE Booking_System SHALL calculate duration from the time slot's `start_time` and `end_time` fields
4. WHEN no end time is available, THE Booking_System SHALL default to 30 minutes duration
5. THE Booking_System SHALL display duration in the confirmation screen after successful booking
6. THE Booking_System SHALL include duration in the Google Calendar event

### Requirement 6: Real-Time Form Validation

**User Story:** As a patient, I want to see validation feedback as I fill out the form, so that I can correct errors immediately instead of waiting until I submit.

#### Acceptance Criteria

1. WHEN a user types in a form field, THE Booking_System SHALL validate the field value in real-time
2. WHEN a field value is valid, THE Booking_System SHALL display a green checkmark icon next to the field
3. WHEN a field value is invalid, THE Booking_System SHALL display an inline error message below the field
4. THE Booking_System SHALL validate phone numbers as the user types, showing format hints
5. THE Booking_System SHALL validate email addresses using standard email regex patterns
6. THE Booking_System SHALL validate required fields and show "Required" message when empty and touched
7. THE Booking_System SHALL validate age field to ensure value is between 0 and 150
8. THE Booking_System SHALL disable the "Confirm Booking" button when any required field is invalid

### Requirement 7: Google Calendar Integration

**User Story:** As a patient, I want to add my confirmed appointment to my Google Calendar, so that I don't forget about it.

#### Acceptance Criteria

1. WHEN booking is confirmed, THE Booking_System SHALL display an "Add to Google Calendar" button on the success page
2. WHEN the user clicks "Add to Google Calendar", THE Booking_System SHALL generate a Google Calendar event URL with appointment details
3. THE Booking_System SHALL include in the calendar event: clinic name, doctor name, date, time, duration, clinic address, and appointment reference ID
4. THE Booking_System SHALL open the Google Calendar URL in a new browser tab
5. THE Booking_System SHALL also provide a "Download .ics" button as an alternative for non-Google calendar users
6. THE Booking_System SHALL generate .ics file content with proper iCalendar format including VEVENT, DTSTART, DTEND, SUMMARY, LOCATION, and DESCRIPTION fields

### Requirement 8: Mobile Optimization

**User Story:** As a patient using a mobile device, I want the booking interface to be easy to use on my phone, so that I can book appointments on the go.

#### Acceptance Criteria

1. WHERE the viewport width is less than 768 pixels, THE Booking_System SHALL display time slots in a 2-column grid instead of 3 columns
2. THE Booking_System SHALL ensure all touch targets (buttons, date selectors, time slots) are at least 44x44 pixels
3. THE Booking_System SHALL make date selector buttons scrollable horizontally on mobile with smooth scrolling
4. THE Booking_System SHALL optimize the booking form layout for mobile with single-column field arrangement
5. WHERE the viewport is mobile, THE Booking_System SHALL display availability indicators with condensed text or icon-only format
6. THE Booking_System SHALL ensure the booking summary sidebar appears below the form on mobile, not as a sticky sidebar
7. THE Booking_System SHALL use responsive font sizes that scale appropriately for mobile screens (minimum 14px for body text)

### Requirement 9: Booking Summary Enhancements

**User Story:** As a patient, I want to see a clear breakdown of all costs and appointment details, so that I know exactly what I'm paying for.

#### Acceptance Criteria

1. THE Booking_Summary SHALL display the clinic name and city at the top
2. THE Booking_Summary SHALL show the selected doctor's name and specialization with an icon
3. THE Booking_Summary SHALL display the appointment date in a readable format (e.g., "Mon, 15 Jan 2024")
4. THE Booking_Summary SHALL show the appointment time and duration together (e.g., "10:00 AM - 30 minutes")
5. THE Booking_Summary SHALL list the consultation fee as a separate line item
6. THE Booking_Summary SHALL list each selected extra service with its name and individual fee
7. THE Booking_Summary SHALL display the total fee prominently with larger, bold text
8. WHEN on Step 2 (Patient Details), THE Booking_Summary SHALL display patient name and phone number
9. THE Booking_Summary SHALL include an "Edit" button on Step 2 that returns to Step 1 to modify selections

### Requirement 10: Simplified Step Indicator

**User Story:** As a patient, I want to see a simple progress indicator showing I'm on the patient details step, so that I know I'm almost done.

#### Acceptance Criteria

1. THE Booking_System SHALL display a step indicator showing 2 steps instead of 3 steps
2. THE Booking_System SHALL label Step 1 as "Patient Details"
3. THE Booking_System SHALL label Step 2 as "Confirmation"
4. THE Booking_System SHALL show Step 1 as active when THE Patient_Details_Page is displayed
5. THE Booking_System SHALL show Step 2 as active when the confirmation/success page is displayed
6. THE Booking_System SHALL use visual indicators (checkmarks, colors) to show completed steps
7. WHERE the viewport is mobile, THE Booking_System SHALL display a condensed step indicator with icons only

### Requirement 11: Error Handling and Slot Conflicts

**User Story:** As a patient, I want to be notified immediately if my selected time slot becomes unavailable, so that I can choose another slot without losing my other information.

#### Acceptance Criteria

1. WHEN a user attempts to book a slot that was just booked by another user, THE Booking_System SHALL display an error message "This slot was just booked by someone else"
2. WHEN a slot conflict occurs, THE Booking_System SHALL refresh the available slots automatically
3. WHEN a slot conflict occurs, THE Booking_System SHALL preserve the patient's form data (name, phone, email, notes)
4. WHEN a slot conflict occurs, THE Booking_System SHALL return the user to the time slot selection on THE Clinic_Profile_Page
5. THE Booking_System SHALL implement optimistic locking or timestamp checking to detect slot conflicts before final booking
6. WHEN slot data is stale (older than 30 seconds), THE Booking_System SHALL refresh slot availability automatically

### Requirement 12: Accessibility Compliance

**User Story:** As a patient with disabilities, I want the booking interface to be accessible with screen readers and keyboard navigation, so that I can book appointments independently.

#### Acceptance Criteria

1. THE Booking_System SHALL provide proper ARIA labels for all interactive elements (buttons, form fields, checkboxes)
2. THE Booking_System SHALL support full keyboard navigation through all booking steps using Tab, Enter, and Arrow keys
3. THE Booking_System SHALL announce form validation errors to screen readers immediately when they occur
4. THE Booking_System SHALL maintain focus management when navigating between steps
5. THE Booking_System SHALL provide sufficient color contrast ratios (minimum 4.5:1 for normal text, 3:1 for large text) per WCAG 2.1 AA
6. THE Booking_System SHALL ensure all form fields have associated labels that are programmatically linked
7. THE Booking_System SHALL provide visible focus indicators for all interactive elements with minimum 2px outline

### Requirement 13: Performance and Loading States

**User Story:** As a patient, I want the booking interface to load quickly and show me when data is being fetched, so that I know the system is working.

#### Acceptance Criteria

1. WHEN THE Booking_Widget is loading slot data, THE Booking_System SHALL display a loading spinner in the time slots area
2. WHEN THE Patient_Details_Page is submitting the booking, THE Booking_System SHALL disable the "Confirm Booking" button and show a loading spinner
3. THE Booking_System SHALL load and display available slots within 2 seconds of doctor or date selection
4. THE Booking_System SHALL implement debouncing for real-time validation to avoid excessive API calls (minimum 300ms delay)
5. WHEN network requests fail, THE Booking_System SHALL display user-friendly error messages with retry options
6. THE Booking_System SHALL cache slot availability data for 30 seconds to reduce redundant API calls
7. THE Booking_System SHALL prefetch slot data for the next 3 days when a doctor is selected

### Requirement 14: Data Persistence and URL State

**User Story:** As a patient, I want my booking selections to be preserved in the URL, so that I can share the link or refresh the page without losing my progress.

#### Acceptance Criteria

1. WHEN a user selects doctor, date, and time on THE Clinic_Profile_Page, THE Booking_System SHALL encode these values in the URL query parameters
2. THE Booking_System SHALL use URL parameters: `doctor`, `date`, and `time` for appointment selections
3. WHEN THE Book_Page loads with URL parameters, THE Booking_System SHALL pre-populate the booking form with those values
4. WHEN a user refreshes THE Patient_Details_Page, THE Booking_System SHALL preserve all form data using browser session storage
5. THE Booking_System SHALL clear session storage data after successful booking completion
6. WHEN a user navigates back from THE Patient_Details_Page, THE Booking_System SHALL return to THE Clinic_Profile_Page with selections preserved

### Requirement 15: Booking Confirmation and Success Screen

**User Story:** As a patient, I want to see a clear confirmation of my booking with all details and next steps, so that I have confidence my appointment is scheduled.

#### Acceptance Criteria

1. WHEN booking is successful, THE Booking_System SHALL display a success screen with a green checkmark icon
2. THE Booking_System SHALL generate and display a unique booking reference ID (8 characters, uppercase alphanumeric)
3. THE Booking_System SHALL display all appointment details: clinic name, doctor name, date, time, duration, and total fee
4. THE Booking_System SHALL provide an "Add to Google Calendar" button on the success screen
5. THE Booking_System SHALL provide a "My Appointments" button that navigates to the user dashboard
6. THE Booking_System SHALL provide a "Book Another Appointment" button that returns to the clinic profile
7. THE Booking_System SHALL send a confirmation notification (if notification system exists) with appointment details
