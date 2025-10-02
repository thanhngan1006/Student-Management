# Student Management System

## Description

The Student Management System is a web-based application designed to streamline the management of student information, academic performance, and class-related activities. Built with a microservices architecture, the system supports three main user roles: Students, Advisors, and Administrators. It provides functionalities such as student profile management, grade tracking, class management, and a discussion forum.

The application is developed using **ReactJS** for the frontend, **Node.js** for the backend, and **MongoDB** as the database, ensuring scalability, modularity, and a seamless user experience.

## Features

### For Students

- **Login:** Secure login with provided credentials.
- **Password Management:** Change passwords and reset forgotten passwords via email links sent by admins.
- **View Grades:** Access personal grades for each subject per semester.
- **Class and Advisor Information:** View class details and advisor contact information.
- **Forum:** Post and view messages within the class, with email notifications for new posts.

### For Advisors

- **Class Management:** Manage student lists, add or update student information.
- **Bulk Import:** Import student lists from Excel or CSV files.
- **Grade Management:** View class grades, enter or update student grades manually or in bulk.
- **Student Tracking:** Access detailed academic records for individual students.
- **Forum:** Post announcements or respond to student queries, with notifications sent to class members.

### For Administrators

- **User Management:** Create, edit, or deactivate user accounts (students and advisors).
- **Class Management:** Create classes, assign advisors, and manage student assignments.
- **Subject Management:** Add, edit, or remove subjects (including subject code, name, and credits).
- **Semester Management:** Define semesters and associate them with grades.
- **System Oversight:** Monitor and manage all system data.

## Tech Stack

- **Frontend:** ReactJS with Tailwind CSS for responsive and modern UI.
- **Backend:** Node.js with Express.js for RESTful API services.
- **Database:** MongoDB for flexible and scalable data storage.
- **Architecture:** Microservices to ensure modularity and maintainability.

## Installation

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- `npm` or `yarn`

### Steps

1.  **Clone the Repository:**

    ```bash
    git clone https://github.com/username/Student-Management-System.git
    cd Student-Management-System
    ```

2.  **Install Dependencies:**

    - For the backend:
      ```bash
      cd backend
      npm install
      ```
    - For the frontend:
      ```bash
      cd ../frontend
      npm install
      ```

3.  **Set Up Environment Variables:**
    Create a `.env` file in the `backend` directory with the following content:

    ```env
    MONGODB_URI=mongodb://localhost:27017/student-management
    JWT_SECRET=your_jwt_secret
    EMAIL_SERVICE=your_email_service
    EMAIL_USER=your_email
    EMAIL_PASS=your_email_password
    ```

4.  **Run MongoDB:**
    Ensure MongoDB is running locally or provide a cloud-based MongoDB URI in your `.env` file.

5.  **Start the Application:**

    - To start the backend server:
      ```bash
      cd backend
      npm start
      ```
    - To start the frontend application:
      ```bash
      cd ../frontend
      npm start
      ```

6.  **Access the Application:**
    Open [http://localhost:3000](http://localhost:3000) in your browser for the frontend. The backend API runs on `http://localhost:5000` by default.

## API Endpoints

### User Management

- `POST /api/users/login` - User login
- `POST /api/users/reset-password` - Request password reset
- `PUT /api/users/change-password` - Change password (authenticated)

### Class Management

- `GET /api/classes/:id` - Get class details
- `POST /api/classes/import` - Import student list (CSV/Excel)

### Grade Management

- `POST /api/grades` - Enter or update grades
- `GET /api/grades/student/:id` - Get student grades

### Forum

- `POST /api/forum/posts` - Create a forum post
- `GET /api/forum/posts/:classId` - Get posts for a class

### Admin

- `POST /api/admin/users` - Create user accounts
- `POST /api/admin/subjects` - Add new subjects
- `POST /api/admin/semesters` - Define semesters

## Usage

- **Admin:** Log in to create users, subjects, semesters, and classes. Assign advisors to classes.
- **Advisor:** Log in to manage your class, import student lists, enter grades, and interact via the forum.
- **Student:** Log in to view your grades, class information, and participate in the class forum.

## Contributing

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature`).
3.  Commit your changes (`git commit -m 'Add your feature'`).
4.  Push to the branch (`git push origin feature/your-feature`).
5.  Open a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
