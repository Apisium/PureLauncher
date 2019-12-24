import styled from '@emotion/styled'

export const Div = styled('div', {
  shouldForwardProp: prop => ['className', 'children'].indexOf(prop) !== -1
})(((a: any) => a.style) as any)

export const Ul = styled('ul', {
  shouldForwardProp: prop => ['className', 'children'].indexOf(prop) !== -1
})(((a: any) => a.style) as any)
