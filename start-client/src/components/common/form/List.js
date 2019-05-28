import PropTypes from 'prop-types'
import React from 'react'

import CompareVersion from './../../utils/version-compare'
import { IconTimes } from './../icons'

class List extends React.Component {
  onClick = dependency => {
    this.props.remove(dependency)
  }

  render() {
    let dependencies = this.props.list
    return (
      <div className='dependencies-list'>
        {dependencies.map(dependency => {
          const compatibility = dependency.versionRange
            ? CompareVersion(this.props.boot, dependency.versionRange)
            : true
          return (
            <div
              className='dependency-item'
              onClick={() => {
                this.onClick(dependency)
              }}
              key={dependency.id}
            >
              <div className='title'>
                {dependency.name} <span>{dependency.group}</span>
              </div>
              <div className='description'>{dependency.description}</div>
              <IconTimes />
              {!compatibility && (
                <div className='warning' key={`warning${dependency.id}`}>
                  Requires Spring Boot {dependency.versionRequirement}.
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }
}

List.propTypes = {
  list: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      group: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
    })
  ),
  remove: PropTypes.func.isRequired,
  boot: PropTypes.string.isRequired,
}

export default List
