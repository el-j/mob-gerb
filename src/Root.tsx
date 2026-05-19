import { RouterProvider } from 'react-router-dom'

import { router } from './router'

const Root = () => {
  return <RouterProvider router={router} />
}

export default Root
