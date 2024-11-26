import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import Saved from "../../src/Pages/Save/save";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";
import { useUserStore } from "../../src/store/UserStore";
import axios from "axios";
import { toast } from "react-toastify";

// Mock Zustand store
vi.mock("../../src/store/UserStore", () => ({
  useUserStore: vi.fn(),
}));

vi.mock("axios", () => {
  return {
    default: {
      get: vi.fn(),
    },
  };
});

// Mock toast
vi.mock("react-toastify", () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe("Saved Page", () => {
  const mockUserId = "12345";
  const mockSavedJobs = [
    { id: "1", title: "Software Engineer", company: "TechCorp" },
    { id: "2", title: "Data Scientist", company: "DataInc" },
  ];

  beforeEach(() => {
    // Mock Zustand state
    (useUserStore as unknown as jest.Mock).mockReturnValue({
      id: mockUserId,
    });

    // Reset all mocks
    vi.resetAllMocks();
  });

  const renderSavedPage = () =>
    render(
      <MemoryRouter>
        <Saved />
      </MemoryRouter>
    );

  it("renders the Saved page with job list", async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: { data: mockSavedJobs },
    });

    renderSavedPage();

    await waitFor(() => {
      expect(screen.getByText("Software Engineer")).toBeInTheDocument();
      expect(screen.getByText("TechCorp")).toBeInTheDocument();
      expect(screen.getByText("Data Scientist")).toBeInTheDocument();
      expect(screen.getByText("DataInc")).toBeInTheDocument();
    });
  });

  it("displays an error toast when API call fails", async () => {
    (axios.get as jest.Mock).mockRejectedValueOnce(new Error("API Error"));

    renderSavedPage();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error fetching jobs");
    });
  });

  it("shows no jobs when the saved jobs list is empty", async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: { data: [] },
    });

    renderSavedPage();

    await waitFor(() => {
      expect(screen.getByText("Saved Applications")).toBeInTheDocument();
      expect(screen.queryByText("Software Engineer")).not.toBeInTheDocument();
    });
  });

  it("does not fetch jobs if user ID is not available", async () => {
    (useUserStore as unknown as jest.Mock).mockReturnValueOnce({
      id: null,
    });

    renderSavedPage();

    expect(axios.get).not.toHaveBeenCalled();
  });

  it("renders loading state while jobs are being fetched", async () => {
    (axios.get as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Simulate a long API call
    );

    renderSavedPage();

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
