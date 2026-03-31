const React = require("react")
const gatsby = jest.requireActual("gatsby")

module.exports = {
  ...gatsby,
  graphql: jest.fn(),
  Link: jest.fn().mockImplementation(({ to, children, className, ...rest }) =>
    React.createElement("a", { href: to, className, ...rest }, children)
  ),
  StaticQuery: jest.fn(),
  useStaticQuery: jest.fn(),
  withPrefix: jest.fn(path => path),
}
