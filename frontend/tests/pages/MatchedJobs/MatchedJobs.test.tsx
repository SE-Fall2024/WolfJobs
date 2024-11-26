import { render, screen, fireEvent } from "@testing-library/react";
import MatchedJobs from "../../../src/Pages/MatchedJobs/MatchedJobs";
import useUserStore  from "../../src/store/UserStore"; 
import axios from "axios";

jest.mock("axios");
jest.mock("../../store/UserStore", () => ({
  useUserStore: jest.fn()
}));

describe("MatchedJobs Component", () => {
  beforeEach(() => {
    useUserStore.mockReturnValue({
      id: "123",
      email: "testuser@example.com",
      name: "Test User"
    });

    axios.get.mockResolvedValue({
      data: { matchedJobs: [{ jobId: "1", title: "Job 1", requiredSkills: [], matchedSkills: [], matchPercentage: 60, location: "Location", pay: "$100", type: "Full-time", description: "Job description" }] }
    });
  });

  // Test 1: Button Text Change After Click
  it("should change button text to 'Applying...' when clicked", async () => {
    render(<MatchedJobs />);
    
    const applyButton = await screen.findByRole("button", { name: /Apply Now/i });
    
    fireEvent.click(applyButton);

    expect(applyButton).toHaveTextContent("Applying...");
  });

  // Test 2: Button Text After Job Application
  it("should change button text to 'Already Applied' after application", async () => {
    render(<MatchedJobs />);
    
    const applyButton = await screen.findByRole("button", { name: /Apply Now/i });
    
    fireEvent.click(applyButton);
    
    // Simulate the completion of the application
    axios.post.mockResolvedValueOnce({ data: { status: "success" } });
    
    await screen.findByText(/Already Applied/i);
    expect(applyButton).toHaveTextContent("Already Applied");
  });

  // Test 3: Button Disabled After Application
  it("should disable the 'Apply Now' button after application", async () => {
    render(<MatchedJobs />);
    
    const applyButton = await screen.findByRole("button", { name: /Apply Now/i });
    
    fireEvent.click(applyButton);
    
    // Simulate successful job application
    axios.post.mockResolvedValueOnce({ data: { status: "success" } });
    
    const disabledButton = await screen.findByRole("button", { name: /Already Applied/i });
    expect(disabledButton).toBeDisabled();
  });

  // Test 4: No Jobs Available Message
  it("should show 'No matched jobs found.' if no jobs are available", async () => {
    axios.get.mockResolvedValueOnce({ data: { matchedJobs: [] } });
    
    render(<MatchedJobs />);
    
    const noJobsMessage = await screen.findByText(/No matched jobs found/i);
    expect(noJobsMessage).toBeInTheDocument();
  });

  // Test 5: Job Title Rendered Correctly
  it("should render job title correctly", async () => {
    render(<MatchedJobs />);
    
    const jobTitle = await screen.findByText(/Job 1/i);
    expect(jobTitle).toBeInTheDocument();
  });

  // Test 6: Job Location Rendered Correctly
  it("should render job location correctly", async () => {
    render(<MatchedJobs />);
    
    const jobLocation = await screen.findByText(/Location/i);
    expect(jobLocation).toBeInTheDocument();
  });

  // Test 7: Job Pay Rendered Correctly
  it("should render job pay correctly", async () => {
    render(<MatchedJobs />);
    
    const jobPay = await screen.findByText(/\$100/i);
    expect(jobPay).toBeInTheDocument();
  });

  // Test 8: Skills Displayed Correctly
  it("should render job skills correctly", async () => {
    render(<MatchedJobs />);
    
    const requiredSkills = await screen.findByText(/Required Skills:/i);
    const matchedSkills = await screen.findByText(/Matched Skills:/i);

    expect(requiredSkills).toBeInTheDocument();
    expect(matchedSkills).toBeInTheDocument();
  });

  // Test 9: Match Percentage Rendered Correctly
  it("should render match percentage correctly", async () => {
    render(<MatchedJobs />);
    
    const matchPercentage = await screen.findByText(/60%/i);
    expect(matchPercentage).toBeInTheDocument();
  });

  // Test 10: Error Handling on Job Application Failure
  it("should show error toast if job application fails", async () => {
    render(<MatchedJobs />);
    
    const applyButton = await screen.findByRole("button", { name: /Apply Now/i });
    
    fireEvent.click(applyButton);
    
    // Simulate a failed application
    axios.post.mockRejectedValueOnce(new Error("Application failed"));
    
    // Wait for the error toast to appear
    const errorToast = await screen.findByText(/Application failed/i);
    expect(errorToast).toBeInTheDocument();
  });
});
