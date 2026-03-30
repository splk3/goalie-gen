const React = require("react")
const gatsby = jest.requireActual("gatsby")

module.exports = {
  ...gatsby,
  graphql: jest.fn(),
  Link: jest.fn().mockImplementation(({ to, children, className }) =>
    React.createElement("a", { href: to, className }, children)
  ),
  StaticQuery: jest.fn(),
  useStaticQuery: jest.fn(),
  withPrefix: jest.fn(path => path),
}
