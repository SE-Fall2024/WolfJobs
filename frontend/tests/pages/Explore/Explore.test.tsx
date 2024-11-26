import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import Explore from "../../../src/Pages/Explore/Explore";
import { MemoryRouter } from "react-router";

describe("Explore Page", () => {
  // Helper function to render the Explore page with MemoryRouter for routing
  const renderExplorePage = () =>
    render(
      <MemoryRouter>
        <Explore />
      </MemoryRouter>
    );

  test("renders Explore component without crashing", () => {
    renderExplorePage();
    expect(screen.getByPlaceholderText("Search jobs...")).toBeInTheDocument();
  });

  test("displays sorting buttons with correct default text", () => {
    renderExplorePage();
    expect(screen.getByText("Sort by Highest Pay : Off")).toBeInTheDocument();
    expect(screen.getByText("Sort by City : Off")).toBeInTheDocument();
    expect(screen.getByText("Sort by Employment Type : Off")).toBeInTheDocument();
    expect(screen.getByText("Show Closed Jobs")).toBeInTheDocument();
  });

  test("displays All Jobs heading in job list section", () => {
    renderExplorePage();
    expect(screen.getByText("All jobs")).toBeInTheDocument();
  });

  test("displays message when no jobs are available", () => {
    renderExplorePage();
    expect(screen.getByText("Nothing to show!")).toBeInTheDocument();
    expect(screen.getByText("Select a job for more details")).toBeInTheDocument();
  });
  test("renders the search bar with placeholder text", () => {
    renderExplorePage();
    const searchInput = screen.getByPlaceholderText("Search jobs...");
    expect(searchInput).toBeInTheDocument();
  });

  test("toggles sort by highest pay button text", () => {
    renderExplorePage();
    const sortButton = screen.getByText("Sort by Highest Pay : Off");
    fireEvent.click(sortButton);
    expect(sortButton).toHaveTextContent("Sort by High Pay : On");
  });

  test("toggles sort by city button text", () => {
    renderExplorePage();
    const sortButton = screen.getByText("Sort by City : Off");
    fireEvent.click(sortButton);
    expect(sortButton).toHaveTextContent("Sort by City : On");
  });

  test("toggles sort by employment type button text", () => {
    renderExplorePage();
    const sortButton = screen.getByText("Sort by Employment Type : Off");
    fireEvent.click(sortButton);
    expect(sortButton).toHaveTextContent("Sort by Employment Type : On");
  });

  test("toggles job status button text between open and closed jobs", () => {
    renderExplorePage();
    const jobStatusButton = screen.getByText("Show Closed Jobs");
    fireEvent.click(jobStatusButton);
    expect(jobStatusButton).toHaveTextContent("Show Open Jobs");
  });
  test("filters jobs by location", () => {
    renderExplorePage();
    const locationInput = screen.getByPlaceholderText("Enter location");
    fireEvent.change(locationInput, { target: { value: "New York" } });

    // Assuming there's a button to apply filters in the dropdown
    const applyFiltersButton = screen.getByText("Apply Filters");
    fireEvent.click(applyFiltersButton);

    // Check if the filtered job list matches the location criteria
    // Replace with appropriate text related to filtered job results
    expect(
      screen.getByText("Filtered jobs for location: New York")
    ).toBeInTheDocument();
  });

  test("filters jobs by minimum salary", () => {
    renderExplorePage();
    const minSalaryInput = screen.getByPlaceholderText("Enter min salary");
    fireEvent.change(minSalaryInput, { target: { value: "50000" } });

    const applyFiltersButton = screen.getByText("Apply Filters");
    fireEvent.click(applyFiltersButton);

    // Check if the filtered job list matches the salary criteria
    expect(
      screen.getByText("Jobs with a minimum salary of 50000")
    ).toBeInTheDocument();
  });

  test("filters jobs by maximum salary", () => {
    renderExplorePage();
    const maxSalaryInput = screen.getByPlaceholderText("Enter max salary");
    fireEvent.change(maxSalaryInput, { target: { value: "100000" } });

    const applyFiltersButton = screen.getByText("Apply Filters");
    fireEvent.click(applyFiltersButton);

    // Check if the filtered job list matches the salary criteria
    expect(
      screen.getByText("Jobs with a maximum salary of 100000")
    ).toBeInTheDocument();
  });

  test("filters jobs by employment type", () => {
    renderExplorePage();
    const jobTypeDropdown = screen.getByLabelText("Job Type");
    fireEvent.change(jobTypeDropdown, { target: { value: "full-time" } });

    expect(
      screen.getByText("Filtered jobs for full-time employment")
    ).toBeInTheDocument();
  });

  test("filters jobs by both location and salary", () => {
    renderExplorePage();
    const locationInput = screen.getByPlaceholderText("Enter location");
    fireEvent.change(locationInput, { target: { value: "New York" } });

    const minSalaryInput = screen.getByPlaceholderText("Enter min salary");
    fireEvent.change(minSalaryInput, { target: { value: "50000" } });

    const maxSalaryInput = screen.getByPlaceholderText("Enter max salary");
    fireEvent.change(maxSalaryInput, { target: { value: "100000" } });

    const applyFiltersButton = screen.getByText("Apply Filters");
    fireEvent.click(applyFiltersButton);

    // Check if the filtered job list matches both the location and salary criteria
    expect(
      screen.getByText("Filtered jobs for location: New York")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Jobs with a salary range of 50000 - 100000")
    ).toBeInTheDocument();
  });

  test("filters jobs by both location and employment type", () => {
    renderExplorePage();
    const locationInput = screen.getByPlaceholderText("Enter location");
    fireEvent.change(locationInput, { target: { value: "Los Angeles" } });

    const jobTypeDropdown = screen.getByLabelText("Job Type");
    fireEvent.change(jobTypeDropdown, { target: { value: "part-time" } });

    const applyFiltersButton = screen.getByText("Apply Filters");
    fireEvent.click(applyFiltersButton);

    // Check if the filtered job list matches both the location and employment type criteria
    expect(
      screen.getByText("Filtered jobs for location: Los Angeles")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Filtered jobs for part-time employment")
    ).toBeInTheDocument();
  });

  test("renders job details when a job is clicked", () => {
    renderExplorePage();
    const jobListItem = screen.getByText("Job Name"); // Replace with actual job name
    fireEvent.click(jobListItem);

    expect(screen.getByText("Job Details")).toBeInTheDocument(); // Replace with actual job detail title or content
  });

  test("displays the correct job type in the job details view", () => {
    renderExplorePage();
    const jobListItem = screen.getByText("Job Name"); // Replace with actual job name
    fireEvent.click(jobListItem);

    // Assuming there's a job type label in the details view
    expect(screen.getByText("Full Time")).toBeInTheDocument(); // Replace with actual job type
  });

  test("shows message when no jobs match search or filters", () => {
    renderExplorePage();
    const locationInput = screen.getByPlaceholderText("Enter location");
    fireEvent.change(locationInput, { target: { value: "Nonexistent City" } });

    const applyFiltersButton = screen.getByText("Apply Filters");
    fireEvent.click(applyFiltersButton);

    expect(
      screen.getByText("No jobs found matching your filters")
    ).toBeInTheDocument();
  });

  test("displays correct job count after applying filters", () => {
    renderExplorePage();
    const locationInput = screen.getByPlaceholderText("Enter location");
    fireEvent.change(locationInput, { target: { value: "San Francisco" } });

    const applyFiltersButton = screen.getByText("Apply Filters");
    fireEvent.click(applyFiltersButton);

    // Assuming there is a job count display element
    expect(screen.getByText("Displaying 3 jobs")).toBeInTheDocument(); // Replace with the actual number of jobs
  });

  test("search bar correctly filters job names", () => {
    renderExplorePage();
    const searchInput = screen.getByPlaceholderText("Search jobs...");
    fireEvent.change(searchInput, { target: { value: "Engineer" } });

    // Assuming the list updates with matching job names
    expect(screen.getByText("Software Engineer")).toBeInTheDocument(); // Replace with actual job name
    expect(screen.queryByText("Marketing Manager")).toBeNull(); // Replace with a job name that shouldn't match
  });

  test("correctly toggles job status between open and closed", () => {
    renderExplorePage();
    const jobStatusButton = screen.getByText("Show Closed Jobs");
    fireEvent.click(jobStatusButton);

    expect(jobStatusButton).toHaveTextContent("Show Open Jobs");
    expect(screen.queryByText("Closed Job")).toBeInTheDocument(); // Replace with actual closed job text

    fireEvent.click(jobStatusButton);
    expect(jobStatusButton).toHaveTextContent("Show Closed Jobs");
    expect(screen.queryByText("Open Job")).toBeInTheDocument(); // Replace with actual open job text
  });
});
