/**
 * Common Enums - Shared across modules
 */

// Collection Names
export enum CollectionName {
  USERS = 'users',
  POST = 'posts',
  CATEGORIES = 'categories',
  COURSES = 'courses',
  COURSE_SECTIONS = 'course_sections',
  LECTURES = 'lectures',
  QUIZZES = 'quizzes',
  QUIZ_QUESTIONS = 'quiz_questions',
  QUIZ_ATTEMPTS = 'quiz_attempts',
  ANSWERS = 'answers',
  ENROLLMENTS = 'enrollments',
  ORDERS = 'orders',
  COURSE_REVIEWS = 'course_reviews',
  CARTS = 'carts',
  INSTRUCTOR_EARNINGS = 'instructor_earnings',
  WISHLISTS = 'wishlists',
  COMPLAINTS = 'complaints',
  PROMOTIONS = 'promotions',
  COUPONS = 'coupons',
  COUPON_USAGES = 'coupon_usages',
  LOCATIONS = 'locations',
  SESSIONS = 'sessions'
}

// Quiz Type Enum
export enum QuizType {
  MULTIPLE_CHOICE = 'multiple_choice',
  FILL_BLANK = 'fill_blank'
}

// Common Messages
export enum CommonMessage {
  VALIDATION_ERROR = 'Dữ liệu không hợp lệ',
  SERVER_ERROR = 'Có lỗi xảy ra trên server',
  SERVER_RUNNING = 'Server đang chạy',
  WELCOME_MESSAGE = 'Chào mừng đến với Todo API!'
}

export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
  SELLER = 'seller'
}


// Sort Direction (Common)
export enum SortDirection {
  ASC = 1,
  DESC = -1
}
