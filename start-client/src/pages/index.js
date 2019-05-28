import FileSaver from 'file-saver'
import React from 'react'
import get from 'lodash.get'
import queryString from 'query-string'
import querystring from 'querystring'
import set from 'lodash.set'
import { GlobalHotKeys } from 'react-hotkeys'
import { ToastContainer, toast } from 'react-toastify'
import { graphql } from 'gatsby'

import { CheckboxList } from '../components/common/checkbox-list'
import { Footer, Layout } from '../components/common/layout'
import {
  IconChevronRight,
  IconList,
  IconSearch,
} from '../components/common/icons'
import { List, RadioGroup } from '../components/common/form'
import { Meta } from '../components/common/meta'
import { Typehead } from '../components/common/typehead'

class IndexPage extends React.Component {
  constructor(props) {
    super(props)
    const data = this.props.data.allContentJson.edges[0].node
    let values = { ...data.default }
    set(values, 'meta.name', get(data, 'default.meta.artifact'))
    set(
      values,
      'meta.packageName',
      `${get(data, 'default.meta.group')}.${get(data, 'default.meta.artifact')}`
    )
    this.state = {
      dependencies: [],
      tab: 'quick-search',
      more: false,
      ...values,
    }
    this.keyMap = {
      SUBMIT: ['command+enter', 'ctrl+enter'],
    }
    const submit = this.onSubmit
    this.handlers = {
      SUBMIT: event => {
        submit(event)
      },
    }
    // Parsing parameters URL (search or hash)
    if (props.location.search || props.location.hash) {
      let queryParams = queryString.parse(props.location.search)
      if (props.location.hash) {
        let hash = props.location.hash.substr(2)
        queryParams = queryString.parse(`?${hash}`)
      }
      const params = {
        type: 'project',
        language: 'language',
        boot: 'boot',
        packaging: 'meta.packaging',
        javaVersion: 'meta.java',
        groupId: 'meta.group',
        artifactId: 'meta.artifact',
        name: 'meta.name',
        description: 'meta.description',
        packageName: 'meta.packageName',
      }
      Object.keys(queryParams).forEach(entry => {
        const key = get(params, entry)
        const value = get(queryParams, entry).toLowerCase()
        if (key) {
          switch (key) {
            case 'project':
            case 'language':
            case 'boot':
            case 'meta.packaging':
            case 'meta.java':
              const vals = get(data, key, [])
              if (vals.find(a => a.key === value)) {
                set(this.state, key, value)
              }
              break
            default:
              set(this.state, key, value)
          }
        }
      })
    }
  }

  componentDidMount() {}

  dependencyAdd = dependency => {
    this.setState({ dependencies: [...this.state.dependencies, dependency] })
  }

  dependencyRemove = dependency => {
    this.setState({
      dependencies: this.state.dependencies.filter(
        item => dependency.name !== item.name
      ),
    })
  }

  toggle = event => {
    event.preventDefault()
    this.setState({ more: !this.state.more })

    if (!this.state.more) {
      setTimeout(() => {
        this.inputMetaName && this.inputMetaName.focus()
      }, 300)
    }
  }

  setTab = tab => {
    this.setState({ tab: tab })
    // Hack focus
    if (tab === 'quick-search') {
      try {
        setTimeout(() => {
          document.getElementById('input-quicksearch').focus()
        }, 100)
      } catch (e) {}
    }
  }

  updateMetaState = (prop, value) => {
    let meta = { ...this.state.meta }
    meta[prop] = value
    if (prop === 'artifact') {
      set(meta, 'name', get(meta, 'artifact'))
      set(meta, 'packageName', `${get(meta, 'group')}.${get(meta, 'artifact')}`)
    }
    if (prop === 'group') {
      set(meta, 'packageName', `${get(meta, 'group')}.${get(meta, 'artifact')}`)
    }
    this.setState({ meta: meta })
  }

  onSubmit = event => {
    event.preventDefault()
    const { project, language, boot, meta, dependencies } = this.state
    const apiUrl = this.props.data.site.edges[0].node.siteMetadata.apiUrl
    const url = `${apiUrl}starter.zip`
    const params = querystring.stringify({
      type: project,
      language: language,
      bootVersion: boot,
      baseDir: meta.artifact,
      groupId: meta.group,
      artifactId: meta.artifact,
      name: meta.name,
      description: meta.description,
      packageName: meta.packageName,
      packaging: meta.packaging,
      javaVersion: meta.java,
    })
    const paramsDependencies = dependencies
      .map(dep => `&style=${dep.id}`)
      .join('')
    fetch(`${url}?${params}${paramsDependencies}`, { method: 'GET' })
      .then(
        function(response) {
          if (response.status === 200) {
            return response.blob()
          }
          return null
        },
        function(error) {
          return null
        }
      )
      .then(function(blob) {
        if (!blob) {
          toast.error('The server API is not available.')
          return
        }
        const fileName = `${meta.artifact}.zip`
        FileSaver.saveAs(blob, fileName)
        toast.success('Your project has been generated with success.')
      })
  }

  render() {
    const data = this.props.data.allContentJson.edges[0].node
    return (
      <Layout>
        <GlobalHotKeys keyMap={this.keyMap} handlers={this.handlers} />
        <Meta />
        <ToastContainer position='top-center' hideProgressBar />
        <form onSubmit={this.onSubmit}>
          <div className='colset'>
            <div className='left'>Project</div>
            <div className='right'>
              <RadioGroup
                name='project'
                selected={this.state.project}
                options={data.project}
                onChange={value => {
                  this.setState({ project: value })
                }}
              />
            </div>
          </div>
          <div className='colset'>
            <div className='left'>Language</div>
            <div className='right'>
              <RadioGroup
                name='language'
                selected={this.state.language}
                onChange={value => {
                  this.setState({ language: value })
                }}
                options={data.language}
              />
            </div>
          </div>
          <div className='colset'>
            <div className='left'>Spring Boot</div>
            <div className='right'>
              <RadioGroup
                name='boot'
                selected={this.state.boot}
                options={data.boot}
                onChange={value => {
                  this.setState({ boot: value })
                }}
              />
            </div>
          </div>
          <div className='colset'>
            <div className='left'>Project Metadata</div>
            <div className='right right-md'>
              <div className='control'>
                <label>Group</label>
                <input
                  type='text'
                  className='control-input'
                  value={this.state.meta.group}
                  onChange={event => {
                    this.updateMetaState('group', event.target.value)
                  }}
                />
              </div>
              <div className='control'>
                <label>Artifact</label>
                <input
                  type='text'
                  className='control-input'
                  value={this.state.meta.artifact}
                  onChange={event => {
                    this.updateMetaState('artifact', event.target.value)
                  }}
                />
              </div>

              <div className='more'>
                <div className='wrap'>
                  <a
                    href='/'
                    onClick={this.toggle}
                    className={this.state.more ? 'toggle' : ''}
                  >
                    <IconChevronRight />
                    {!this.state.more ? 'Options' : 'Options'}
                  </a>
                </div>
              </div>

              <div className={`panel ${this.state.more ? 'panel-active' : ''}`}>
                <div className='panel-wrap'>
                  <div className='control'>
                    <label>Name</label>
                    <input
                      type='text'
                      className='control-input'
                      value={this.state.meta.name}
                      disabled={!this.state.more}
                      ref={input => {
                        this.inputMetaName = input
                      }}
                      onChange={event => {
                        this.updateMetaState('name', event.target.value)
                      }}
                    />
                  </div>
                  <div className='control'>
                    <label>Description</label>
                    <input
                      type='text'
                      className='control-input'
                      disabled={!this.state.more}
                      value={this.state.meta.description}
                      onChange={event => {
                        this.updateMetaState('description', event.target.value)
                      }}
                    />
                  </div>
                  <div className='control'>
                    <label>Package Name</label>
                    <input
                      type='text'
                      className='control-input'
                      disabled={!this.state.more}
                      value={this.state.meta.packageName}
                      onChange={event => {
                        this.updateMetaState('packageName', event.target.value)
                      }}
                    />
                  </div>
                  <div className='control'>
                    <label>Packaging</label>
                    <div>
                      <RadioGroup
                        name='packaging'
                        disabled={!this.state.more}
                        selected={this.state.meta.packaging}
                        options={data.meta.packaging}
                        onChange={value => {
                          this.updateMetaState('packaging', value)
                        }}
                      />
                    </div>
                  </div>
                  <div className='control'>
                    <label>Java</label>
                    <div>
                      <RadioGroup
                        name='java'
                        disabled={!this.state.more}
                        selected={this.state.meta.java}
                        options={data.meta.java}
                        onChange={value => {
                          this.updateMetaState('java', value)
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='colset'>
            <div className='left'>
              <div className='sticky-label'>Dependencies</div>
            </div>
            <div className='dependencies-box'>
              <div className='tab'>
                <div className='tab-container'>
                  <a
                    href='/'
                    onClick={event => {
                      event.preventDefault()
                      this.setTab('quick-search')
                    }}
                    className={`${
                      this.state.tab === 'quick-search' ? 'active' : ''
                    }`}
                  >
                    <IconSearch />
                  </a>
                  <a
                    href='/'
                    onClick={event => {
                      event.preventDefault()
                      this.setTab('list')
                    }}
                    className={`${this.state.tab === 'list' ? 'active' : ''}`}
                  >
                    <IconList />
                  </a>
                  {this.state.dependencies.length > 0 && (
                    <>
                      <strong>
                        <span>{this.state.dependencies.length}</span> selected
                      </strong>
                    </>
                  )}
                </div>
              </div>

              {this.state.tab === 'quick-search' ? (
                <div className='colset-2'>
                  <div className='column'>
                    <label className='search-label'>
                      Search dependencies to add
                    </label>
                    <Typehead
                      boot={this.state.boot}
                      add={this.dependencyAdd}
                      submit={this.onSubmit}
                      options={data.dependencies}
                      exclude={this.state.dependencies}
                    />
                  </div>
                  <div className='column'>
                    {this.state.dependencies.length > 0 && (
                      <>
                        <label>Selected dependencies</label>
                        <List
                          boot={this.state.boot}
                          remove={this.dependencyRemove}
                          list={this.state.dependencies}
                        />
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <CheckboxList
                  boot={this.state.boot}
                  add={this.dependencyAdd}
                  remove={this.dependencyRemove}
                  list={data.dependencies}
                  checked={this.state.dependencies}
                />
              )}
            </div>
          </div>

          <div className='sticky'>
            <div className='colset'>
              <div className='left nopadding'>
                <Footer />
              </div>
              <div className='right nopadding'>
                <div className='submit'>
                  <button
                    className='button primary'
                    type='submit'
                    id='generate-project'
                  >
                    Generate the project - ⌘ + ⏎
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Layout>
    )
  }
}

export const jsonObject = graphql`
  query {
    site: allSite {
      edges {
        node {
          id
          siteMetadata {
            title
            description
            twitter
            canonical
            author
            image
            apiUrl
          }
        }
      }
    }
    allContentJson {
      edges {
        node {
          id
          project {
            key
            text
          }
          language {
            key
            text
          }
          boot {
            key
            text
          }
          meta {
            packaging {
              key
              text
            }
            java {
              key
              text
            }
          }
          default {
            project
            language
            boot
            meta {
              group
              artifact
              description
              packaging
              java
            }
          }
          dependencies {
            id
            name
            group
            weight
            description
            versionRequirement
            versionRange
            keywords
          }
        }
      }
    }
  }
`

export default IndexPage
