import React from 'react'
import styled from '@emotion/styled'

const Loading = styled(({ className }) => (
  <div className={className}>loading...</div>
))(({ style }) => style)

export default Loading
