import Layout from "../../components/Layout";

export default function JobsPage() {
  return (
    <Layout variant="landing">
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="inline-block px-8 py-4 rounded-full border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <p className="text-lg font-medium text-[#333333] dark:text-white">Coming Soon</p>
        </div>
      </div>
    </Layout>
  );
}
