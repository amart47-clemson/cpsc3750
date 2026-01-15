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

- AI Usage:
    * Prompt:
        * I'm building a collection manager for a web development class. Can you suggest some different domain options and for each domain, please list what fields each record should have. I need meaningful data that also supports CRUD operations and statistics.
    * Usage:
        * Helped me choose workout logs and define appropriate data fields.
    
    * Prompt:
        * For a workout log collection manager, what sections should my HTMl page have? I need a list view, an add/edit form, a stats display, and a delete confirmation. Can you please suggest a basic HTML structure?
    * Usage:
        Provided me a logical page layout structure that I customized for my needs.

    * Prompt:
        * I have an HTMl page with a stats section, a form section, and a table. Could you please suggest a CSS approach for making this look very clean and readable?
    * Usage:
        * Suggested CSS Grid for stats cards and table for styling that I then customized.

    * Prompt:
        * For my workout log app, I need to calculate statistics like total workouts, average duration, and most common exercise type. Can you help explain the logic?
    * Usage:
        * Explained the reduce method and counting logic that I implemented.

    
Name: Anthony Martino
Class: CPSC 3750 - Web Application Development
Date: 1/15/2026
    
    