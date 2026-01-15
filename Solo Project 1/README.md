Workout Log Manager
- A web based application for tracking and managing your workout history. Built with JavaScript, HTML, and CSS with localStorage for data persistence.

Features
- Full CRUD Operations: Create, Read, Update, and Delete workout entries
- Data Persistence: View total workouts, minutes, calories, and more
- Input Validation: Required fields and numeric range validation
- Delete Confirmation: Safe deletion with confirmation modal
- 30+ Sample Records: Pre-loaded with sample workout data

Local Setup Instructions
- Installation Steps:
    * Start XAMPP 
        * Start the Apache server
    * Copy Project Files
        * Create new folder called workout-log
            * macOS: /Applications/XAMPP/xamppfiles/htdocs
    * All Files:
        * index.html
        * style.css
        * app.js
        * README.md
    * Access the Application
        * Open web browser
        * Navigate to http://localhost/workout-log
        * The application will load with 30 pre-populated workout entries

How to Use:
- Adding a Workout
    * Fill in the "Add New Workout" form with all required fields
    * Click "Save Workout"
- Editing a Workout
    * Click the "Edit" button on any workout in the table
    * Make your changes in the form
    * Click "Save Workout" to update
- Deleting a Workout
    * Click the "Delete" button on any workout
    * Confirm the deletion in the popup modal
- Viewing Statistics
    * The stats section at the top displays
        * Total number of workouts
        * Total minutes exercised
        * Total calories burned
        * Average workout duration
        * Most common exercise type


Technologies Used:
- HTML5: Structure and semantics
- CSS3: Styling and responsive design
- JavaScript: Application logic and DOM manipulation
- localStorage API: Client-side data persistence
- XAMPP Apache: Local web server