import React from 'react'

import { Ul } from '../common'

const Loading = ({ style, decorators }) => (
  <Ul style={style.subtree}>
    <li>
      <decorators.Loading style={style.loading} />
    </li>
  </Ul>
)

export default Loading
