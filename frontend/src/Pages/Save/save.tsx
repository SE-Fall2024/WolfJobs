import { useEffect, useState } from "react";
import JobDetailView from "../../components/Job/JobDetailView";
import axios from "axios";
import { toast } from "react-toastify";
import { useUserStore } from "../../store/UserStore";
import JobsListView from "../../components/Job/JobListView";
const Saved = () => {
  const userId = useUserStore((state) => state.id);
  const [filteredJobList, setFilteredJobList] = useState<Job[]>([]);
  useEffect(() => {
    // Fetch saved jobs
    const fetchSavedJobs = async () => {
      await axios
        .get(`http://localhost:8000/api/v1/users/saveJobList/${userId}`)
        .then((res) => {
          if (res.status !== 200) {
            toast.error("Error fetching jobs");
            return;
          }
          console.log(res.data.data);
          setFilteredJobList(res.data.data as Job[]);
        });
    };
    fetchSavedJobs();
  }, [filteredJobList]);
  return (
    <>
      <div className="content bg-slate-50">
        {/* <div className="flex flex-row" style={{ height: "calc(100vh - 72px)" }}> */}
        <div className="flex flex-row" style={{ height: "calc(100vh - 72px)" }}>
          <JobsListView
            jobsList={filteredJobList}
            title={"Saved Applications"}
          />
          <JobDetailView />
        </div>
      </div>
    </>
  );
};
export default Saved;
