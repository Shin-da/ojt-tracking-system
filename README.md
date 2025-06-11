# OJT TRACKER 📚

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![PHP](https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://www.php.net/)
[![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

> A modern web-based On-the-Job Training Management System built with React and PHP, designed to streamline the tracking and evaluation of student internships. This project was originally developed by Jeffmathew D. Garcia during his internship at SP Madrid & Associates to help track and manage his own progress.

## ✨ Key Features

- 📋 **Interactive Dashboard**
  - Real-time statistics and analytics
  - Calendar heatmap for attendance visualization
  - Quick access to important functions
  
- 👥 **User Management**
  - Role-based access control (Admin, Coordinator, Student)
  - Secure authentication system with JWT
  - User profile management
  
- ⏰ **Time Logging System**
  - Real-time attendance tracking
  - Daily time records with validation
  - Leave management and approval workflow
  
- 📊 **Progress Tracking**
  - Weekly accomplishment reports
  - Performance evaluations
  - Task management with status updates
  
- 📁 **Document Management**
  - Secure file upload and storage
  - Document versioning
  - Easy document retrieval and sharing
  
- 📈 **Reports Generation**
  - Customizable report templates
  - PDF export functionality
  - Statistical analysis and charts

## 💻 Tech Stack

### Frontend
- React 18
- Tailwind CSS
- Chart.js for data visualization
- React Router for navigation
- Axios for API requests
- jsPDF for PDF generation

### Backend
- PHP 7+
- MySQL Database
- RESTful API Architecture

### Development Tools
- Vite for build and development
- ESLint for code quality
- PostCSS for CSS processing
- Git for version control

## 🛠️ Installation

1. Clone the repository
   ```bash
   git clone https://github.com/Shin-da/ojt-tracking-system.git
   cd ojt-tracking-system
   ```

2. Install Frontend Dependencies
   ```bash
   npm install
   ```

3. Set up XAMPP
   - Install XAMPP
   - Place the project in `htdocs` folder
   - Start Apache and MySQL services

4. Configure Database
   - Create a new database named `ojt_db`
   - Import the provided SQL file

5. Environment Setup
   - Copy `.env.example` to `.env`
   - Update database credentials and API endpoints

## 🏃‍♂️ Running the Application

1. Start the Development Server
   ```bash
   npm run dev
   ```

2. Access the application through:
   ```
   http://localhost/OJT TRACKER
   ```

3. Default login credentials:
   - Admin: admin@admin.com / admin123
   - Student: student@example.com / student123

## 📁 Project Structure

```
├── src/                    # Frontend source
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom hooks
│   └── utils/            # Utility functions
├── api/                   # Backend API
│   ├── tasks/            # Task endpoints
│   ├── auth/             # Authentication
│   ├── documents/        # Document handling
│   └── includes/         # Shared PHP code
├── dist/                  # Built frontend
└── uploads/              # File uploads
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Jeffmathew D. Garcia** - *Initial work* - [Shin-da](https://github.com/Shin-da)

## 📖 Project Origin

This OJT Tracker was originally developed by Jeffmathew D. Garcia during his internship at SP Madrid & Associates. The project was created as a personal tool to help track and manage his own progress during the internship period. What started as a personal project has evolved into a comprehensive system that can benefit other interns and organizations in managing their OJT programs.

## 🙏 Acknowledgments

- Special thanks to SP Madrid & Associates for the internship opportunity that inspired this project
- Thanks to all contributors who have helped shape this project
- Special thanks to the open-source community for the amazing tools and libraries
