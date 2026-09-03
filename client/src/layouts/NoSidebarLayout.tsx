import { Outlet } from "react-router";




const NoSidebarLayout = () => {
  return (
    <div className="">
       
        <Outlet />
        

    </div>
  )
}

export default NoSidebarLayout