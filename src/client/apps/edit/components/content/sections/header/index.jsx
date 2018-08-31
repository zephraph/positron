import moment from 'moment'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Header } from '@artsy/reaction/dist/Components/Publishing/Header/Header'
import FileInput from 'client/components/file_input'
import Paragraph from 'client/components/rich_text/components/paragraph.coffee'
import HeaderControls from './controls'
import { PlainText } from 'client/components/draft/plain_text/plain_text'
import { ProgressBar } from 'client/components/file_input/progress_bar'
import { RemoveButton } from 'client/components/remove_button'
import { onChangeArticle } from 'client/actions/edit/articleActions'
import { onChangeHero } from 'client/actions/edit/sectionActions'
import { Deck } from '@artsy/reaction/dist/Components/Publishing/Header/Layouts/Components/FeatureInnerContent'

export class SectionHeader extends Component {
  static propTypes = {
    article: PropTypes.object.isRequired,
    onChange: PropTypes.func,
    onChangeHeroAction: PropTypes.func
  }

  state = {
    progress: null
  }

  onProgress = progress => {
    this.setState({ progress })
  }

  editTitle = () => {
    const { article, onChange } = this.props

    return (
      <PlainText
        content={article.title}
        onChange={content => onChange('title', content)}
        placeholder='Page Title'
      />
    )
  }

  editFeatureDeck = hero => {
    const { onChangeHeroAction } = this.props

    return (
      <PlainText
        content={hero.deck}
        onChange={content => onChangeHeroAction('deck', content)}
        placeholder='Deck (optional)'
      />
    )
  }

  renderFileUpload = prompt => {
    const { onChangeHeroAction } = this.props

    return (
      <FileInput
        type='simple'
        onUpload={src => onChangeHeroAction('url', src)}
        prompt={prompt}
        video
        onProgress={this.onProgress}
      />
    )
  }

  editImage = hero => {
    const { type, url } = hero
    const { onChangeHeroAction } = this.props
    const { progress } = this.state

    const isFullscreen = type && type === 'fullscreen'
    const hasUrl = url && url.length
    const prompt = isFullscreen ? 'Add Background' : 'Add Image or Video'

    if (isFullscreen && hasUrl) {
      return (
        <div className='edit-header__image-container has-image'>
          {this.renderFileUpload('Change Background')}
        </div>
      )
    } else if (hasUrl) {
      return (
        <RemoveButton
          onClick={() => onChangeHeroAction('url', '')}
        />
      )
    } else {
      return (
        <div className='edit-header__image-container' data-has-image={false}>
          {this.renderFileUpload(prompt)}

          {progress &&
            <ProgressBar progress={progress} cover />
          }
        </div>
      )
    }
  }

  getPublishDate = () => {
    const { article } = this.props
    let date = new Date()
    if (article.published) {
      date = article.published_at
    } else if (article.scheduled_publish_at) {
      date = article.scheduled_publish_at
    }
    return moment(date).local().toISOString()
  }

  editLeadParagraph = () => {
    const { article, onChange } = this.props

    return (
      <Paragraph
        html={article.lead_paragraph}
        onChange={(input) => onChange('lead_paragraph', input)}
        placeholder='Lead Paragraph (optional)'
        type='lead_paragraph'
        linked={false}
        stripLinebreaks
        layout={article.layout}
      />
    )
  }

  render() {
    const { article } = this.props
    const isFeature = article.layout === 'feature'
    const isClassic = article.layout === 'classic'
    const hero = article.hero_section || {}

    if (isClassic) {
      return (
        <div className='edit-header'>
          <Header
            article={article}
            date={this.getPublishDate()}
            editTitle={this.editTitle()}
            editLeadParagraph={this.editLeadParagraph()}
          />
        </div>
      )
    } else {
      const headerType = isFeature ? (hero.type || 'text') : ''
      const hasVertical = article.vertical ? undefined : 'Missing Vertical'

      return (
        <HeaderContainer
          className={'edit-header ' + headerType}
          data-type={headerType}
          hasVertical
        >
          {isFeature &&
            <HeaderControls onProgress={this.onProgress} />
          }

          <Header
            article={article}
            date={this.getPublishDate()}
            editDeck={isFeature ? this.editFeatureDeck(hero) : undefined}
            editImage={isFeature ? this.editImage(hero) : undefined}
            editTitle={this.editTitle()}
            editVertical={hasVertical}
          />
        </HeaderContainer>
      )
    }
  }
}

const mapStateToProps = state => ({
  article: state.edit.article
})

const mapDispatchToProps = {
  onChangeHeroAction: onChangeHero,
  onChange: onChangeArticle
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SectionHeader)

const HeaderContainer = styled.div`
  ${Deck} {
    width: 100%;
  }
`
