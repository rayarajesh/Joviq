import { ReviewStories } from "../components/ReviewStories";

const testimonials = [
  {
    name: "Ananya Rao",
    program: "CSE - 3rd Year",
    quote: "The practical project feedback and guidance changed the way I presented my work and built confidence for internships.",
    result: "Internship shortlist in 2 weeks"
  },
  {
    name: "Ishita Sharma",
    program: "IT - 4th Year",
    quote: "The mentoring structure was clear, supportive, and focused on real outcomes. It made my technical interviews much smoother.",
    result: "Cracked 3 technical rounds"
  },
  {
    name: "Karthik Iyer",
    program: "ECE - Final Year",
    quote: "I could clearly connect my projects to industry expectations. The feedback helped me move from learning to execution.",
    result: "Placed after final round"
  },
  {
    name: "Nikhil Shetty",
    program: "Mechanical - 4th Year",
    quote: "The platform gave me clarity, structure, and confidence. I learned how to explain my work in a way interviewers understood.",
    result: "Interview confidence boost"
  },
  {
    name: "Tanvi Joshi",
    program: "CSE - Final Year",
    quote: "Every project felt career-focused. The expert review process and structured guidance made a visible difference in my preparation.",
    result: "Role converted successfully"
  },
  {
    name: "Sanjana Reddy",
    program: "CSE - 3rd Year",
    quote: "The sessions made me feel more prepared, more focused, and more capable of turning academic work into real opportunities.",
    result: "Shortlisted for internship tests"
  }
];

export function ReviewsPage() { return <ReviewStories testimonials={testimonials} />; }
