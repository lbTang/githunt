import React from 'react';
import moment from 'moment';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import './styles.css';
import Loader from '../../components/loader';
import TopNav from '../../components/top-nav';
import Filters from '../../components/filters';
import { fetchTrending } from '../../redux/github/actions';
import RepositoryGrid from '../../components/repository-grid';
import RepositoryList from '../../components/repository-list';
import { updateDateJump, updateLanguage, updateViewType } from '../../redux/preference/actions';
import GroupHeading from '../../components/group-heading';

class FeedContainer extends React.Component {
  componentDidMount() {
    const existingRepositories = this.props.github.repositories || [];
    // If there are no loaded repositories before, fetch them
    if (existingRepositories.length === 0) {
      this.fetchNextRepositories();
    }
  }

  fetchNextRepositories() {
    const filters = this.getFilters();
    this.props.fetchTrending(filters);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const currPreferences = this.props.preference;
    const prevPreferences = prevProps.preference;

    // If language or dateJump has been updated, reload
    // the repositories
    if (currPreferences.language !== prevPreferences.language ||
      currPreferences.dateJump !== prevPreferences.dateJump) {
      this.fetchNextRepositories();
    }
  }

  getFilters() {
    const filters = {};

    filters.dateRange = this.getNextDateRange();

    if (this.props.preference.language) {
      filters.language = this.props.preference.language;
    }

    if (this.props.preference.options.token) {
      filters.token = this.props.preference.options.token;
    }

    return filters;
  }

  getNextDateRange() {
    const repositories = this.props.github.repositories || [];
    const dateJump = this.props.preference.dateJump;

    const dateRange = {};
    const lastRecords = repositories[repositories.length - 1];

    if (lastRecords) {
      dateRange.start = moment(lastRecords.start).subtract(1, dateJump);
      dateRange.end = lastRecords.start;
    } else {
      dateRange.start = moment().add(1, 'day').subtract(1, dateJump);
      dateRange.end = moment();
    }

    return dateRange;
  }

  render() {
    return (
      <div className="page-wrap">
        <TopNav
          updateDateJump={ this.props.updateDateJump }
          selectedDateJump={ this.props.preference.dateJump }
        />

        {
          !this.props.preference.options.token && (
            <p className="alert alert-warning">
              Although not required but make sure to
              <strong className='ml-1 mr-1'>
                <Link to='/options'>add a token</Link>
              </strong>
              to avoid hitting the rate limit
            </p>
          )
        }

        <div className="container mb-5 pb-4">
          <div className="header-row clearfix">
            {
              this.props.github.repositories &&
              this.props.github.repositories[0] &&
              <GroupHeading
                start={ this.props.github.repositories[0].start }
                end={ this.props.github.repositories[0].end }
                dateJump={ this.props.preference.dateJump }
              />
            }
            <div className="group-filters">
              {
                this.props.github.repositories &&
                this.props.github.repositories[0] &&
                <Filters
                  selectedLanguage={ this.props.preference.language }
                  selectedViewType={ this.props.preference.viewType }
                  updateLanguage={ this.props.updateLanguage }
                  updateViewType={ this.props.updateViewType }
                />
              }
            </div>
          </div>
          <div className="body-row">
            {
              this.props.preference.viewType === 'grid'
                ? <RepositoryGrid repositories={ this.props.github.repositories || [] } dateJump={ this.props.preference.dateJump }/>
                : <RepositoryList repositories={ this.props.github.repositories || [] } dateJump={ this.props.preference.dateJump }/>
            }

            { this.props.github.processing && <Loader/> }

            {
              !this.props.github.processing && (
                <button className="btn btn-primary shadow load-next-date"
                        onClick={ () => this.fetchNextRepositories() }>
                  <i className="fa fa-refresh mr-2"></i>
                  Load next { this.props.preference.dateJump }
                </button>
              )
            }
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = store => {
  return {
    preference: store.preference,
    github: store.github
  };
};

const mapDispatchToProps = {
  updateLanguage,
  updateViewType,
  updateDateJump,
  fetchTrending
};

export default connect(mapStateToProps, mapDispatchToProps)(FeedContainer);
