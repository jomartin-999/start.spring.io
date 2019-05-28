import PropTypes from 'prop-types'
import React from 'react'

import CompareVersion from '../../utils/version-compare'
import { IconPlus } from '../icons'

class SearchResultsList extends React.Component {
  onClick = dependency => {
    this.props.onAdded(dependency)
  }

  onMouseEnter = index => {
    this.props.onSelectedChanged(index)
  }

  onMouseLeave = index => {
    this.props.onSelectedChanged(-1)
  }

  isValid(dependency) {
    return dependency.versionRange
      ? CompareVersion(this.props.boot, dependency.versionRange)
      : true
  }

  sortDependenciesByValidThenInvalid(dependencies) {
    dependencies.sort((a, b) => {
      if (this.isValid(a) && !this.isValid(b)) {
        return -1
      }
      if (!this.isValid(a) && this.isValid(b)) {
        return 1
      }
      return 0
    })
  }

  render() {
    let dependencies = this.props.dependencies
    if (dependencies.length > 5) {
      dependencies = dependencies.slice(0, 5)
    }

    this.sortDependenciesByValidThenInvalid(dependencies)

    return (
      <div className='dependencies-list'>
        {dependencies.map((dependency, index) => {
          const valid = this.isValid(dependency)
          return (
            <div
              className={`dependency-item dependency-item-gray ${
                !valid ? 'invalid' : ''
              }  ${this.props.selected === index ? 'selected' : ''}`}
              key={`item${dependency.id}`}
              selected={this.props.selected === index}
              onClick={() => {
                if (valid) {
                  this.onClick(dependency)
                }
              }}
              onMouseEnter={() => {
                this.onMouseEnter(index)
              }}
              onMouseLeave={() => {
                this.onMouseLeave(index)
              }}
            >
              <div className='title' key={`item${dependency.id}`}>
                {dependency.name} <span>{dependency.group}</span>
              </div>
              {valid && (
                <div className='description' key={`description{dependency.id}`}>
                  {dependency.description}
                </div>
              )}

              <IconPlus key={`icon${dependency.id}`} />
              {!valid && (
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

SearchResultsList.propTypes = {
  list: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      group: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      versionRange: PropTypes.string,
      versionRequirement: PropTypes.string,
    })
  ),
  onAdded: PropTypes.func.isRequired,
  boot: PropTypes.string.isRequired,
  selected: PropTypes.number,
  onSelectedChanged: PropTypes.func.isRequired,
}

export default SearchResultsList
