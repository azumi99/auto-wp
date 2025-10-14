import { ChartWorkflowPerformance } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import MainLayout from "@/app/main"

export default function Page() {
  return (
    <MainLayout>

      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards />
        <div className="px-4 lg:px-6">
          <ChartWorkflowPerformance />
        </div>
        {/* <DataTable data={data} /> */}
      </div>

    </MainLayout>

  )
}
