import React, { Component } from 'react';
import { StyleSheet, View, Platform, ListView, Keyboard, AsyncStorage, ActivityIndicator } from 'react-native';

import Header from './Header';
import Footer from './Footer';
import Row from './Row';

const filterItems = (filter, items) => {
  return items.filter((item) => {
    if (filter === 'ALL') return true;
    if (filter === 'COMPLETED') return item.complete;
    if (filter === 'ACTIVE') return !item.complete;
  })
};

export default class App extends Component {
  constructor(props) {
    super(props);
    const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 })
    this.state = {
      allComplete: false,
      loading: true,
      filter: 'ALL',
      value: '',
      items: [],
      dataSource: ds.cloneWithRows([])
    }
    this.setSource = this.setSource.bind(this);
    this.handleAddItem = this.handleAddItem.bind(this);
    this.handleToggleAllComplete = this.handleToggleAllComplete.bind(this);
    this.handleToggleComplete = this.handleToggleComplete.bind(this);
    this.handleRemoveItem = this.handleRemoveItem.bind(this);
    this.handleFilter = this.handleFilter.bind(this);
    this.handleClearComplete = this.handleClearComplete.bind(this);
    this.handleUpdateItem = this.handleUpdateItem.bind(this);
    this.handleToggleEditing = this.handleToggleEditing.bind(this);
  }

  componentWillMount() {
    AsyncStorage.getItem('items').then((json) => {
      try {
        const items = JSON.parse(json);
        this.setSource(items, items, { loading: false });
      } catch(e) {
        this.setState({
          loading: false
        });
      }
    })
  }


  setSource(items, itemDataSources, otherState = {}) {
    this.setState({
      items,
      dataSource: this.state.dataSource.cloneWithRows(itemDataSources),
      ...otherState
    });
    AsyncStorage.setItem('items', JSON.stringify(items));
  }

  handleRemoveItem(key) {
    const newItems = this.state.items.filter((item) => item.key !== key);
    this.setSource(newItems, filterItems(this.state.filter, newItems));
  }

  handleToggleComplete(key, complete) {
    const newItems = this.state.items.map((item) => {
      if (item.key !== key) return item;
      return {
        ...item,
        complete
      }
    });
    this.setSource(newItems, filterItems(this.state.filter, newItems));
  }

  handleAddItem() {
    if (!this.state.value) return;
    const newItems = [
      ...this.state.items,
      {
        key: Date.now(),
        text: this.state.value,
        complete: false
      }
    ];
    this.setSource(newItems, filterItems(this.state.filter, newItems), { value: '' });
  }

  handleToggleAllComplete() {
    const complete = !this.state.allComplete;
    const newItems = this.state.items.map((item) => ({
      ...item,
      complete
    }));

    this.setSource(newItems, filterItems(this.state.filter, newItems), { allComplete: complete });
  }

  handleFilter(filter) {
    this.setSource(this.state.items, filterItems(filter, this.state.items), { filter });
  }

  handleClearComplete() {
    const newItems = filterItems('ACTIVE', this.state.items);
    this.setSource(newItems, filterItems(this.state.filter, newItems));
  }

  handleUpdateItem(key, text) {
    const newItems = this.state.items.map((item) => {
      if (item.key !== key) return item;
      return {
        ...item,
        text
      }
    });
    this.setSource(newItems, filterItems(this.state.filter, newItems));
  }

  handleToggleEditing(key, editing) {
    const newItems = this.state.items.map((item) => {
      if (item.key !== key) return item;
      return {
        ...item,
        editing
      }
    });
    this.setSource(newItems, filterItems(this.state.filter, newItems));
  }

  render() {
    return (
      <View style={styles.container}>
        <Header
          value={this.state.value}
          onAddItem={this.handleAddItem}
          onChange={(value) => this.setState({ value })}
          onToggleAllComplete={this.handleToggleAllComplete}
        />
        <View style={styles.content}>
          <ListView
            enableEmptySections
            dataSource={this.state.dataSource}
            onScroll={() => Keyboard.dismiss()}
            renderRow={({ key, ...value }) => (
              <Row
                key={key}
                {...value}
                style={styles.list}
                onComplete={(complete) => this.handleToggleComplete(key, complete)}
                onUpdate={(text) => this.handleUpdateItem(key, text)}
                onToggleEdit={(editing) => this.handleToggleEditing(key, editing)}
                onRemove={() => this.handleRemoveItem(key)}
              />
            )}
            renderSeparator={({ sectionId, rowId }) => (
              <View key={rowId} style={styles.separator} />
            )}
          />
        </View>
        <Footer
          count={filterItems('ACTIVE', this.state.items).length}
          filter={this.state.filter}
          onFilter={this.handleFilter}
          onClearComplete={this.handleClearComplete}
        />
        {
          this.state.loading && (
            <View style={styles.loading}>
              <ActivityIndicator
                animating
                size="large"
              />
            </View>
          )
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    ...Platform.select({
      ios: { paddingTop: 30 }
    })
  },
  loading: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, .2)'
  },
  content: {
    flex: 1,
    backgroundColor: '#fff'
  },
  list: {
    backgroundColor: '#fff'
  },
  separator: {
    borderWidth: 1,
    borderColor: '#f5f5f5'
  }
});
