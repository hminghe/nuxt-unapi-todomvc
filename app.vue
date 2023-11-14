<script setup lang="ts">
import { ref, computed } from 'vue'
import * as todoApi from './api/todo';
import type { Todo } from '@prisma/client'

const route = useRoute()

const visibility = computed(() => {
  return (route.query.visibility || 'all') as 'all' | 'active' | 'completed'
})

// state
const { data: todos, refresh: refreshTodo } = useAsyncData<Todo[]>(() => {
  return todoApi.getTodos({
    completed: visibility.value === 'all' ? undefined : visibility.value === 'completed',
  })
}, {
  default: () => [],
  watch: [visibility]
})
const editedTodo = ref()


const { data: remaining, refresh: refreshRemaining } = useAsyncData<number>(() => todoApi.getRemaining(), { 
  default: () => 0,
})


async function toggleAll(e) {
  // todos.value.forEach((todo) => (todo.completed = e.target.checked))
  await todoApi.batchUpdateTodo({
    ids: todos.value.map(v => v.id),
    completed: e.target.checked,
  })
  refreshTodo()
  refreshRemaining()
}

async function addTodo(e) {
  console.log('e.target.value', e.target.value)
  const todo = await todoApi.addTodo({ title: e.target.value })
  if (visibility.value !== 'completed') {
    todos.value.push(todo)
  }
  e.target.value = ''
}

async function removeTodo(todo: Todo) {
  await todoApi.removeTodo(todo.id)
  todos.value.splice(todos.value.indexOf(todo), 1)
}

let beforeEditCache = ''
function editTodo(todo: Todo) {
  beforeEditCache = todo.title
  editedTodo.value = todo
}

function cancelEdit(todo: Todo) {
  editedTodo.value = null
  todo.title = beforeEditCache
}

async function doneEdit(todo: Todo) {
  if (editedTodo.value) {
    editedTodo.value = null
    todo.title = todo.title.trim()
    if (!todo.title) {
      removeTodo(todo)
    } else {
      const newTodo = await todoApi.updateTodo({
        id: todo.id,
        title: todo.title,
      })
      Object.assign(todo, newTodo)
    }
  }
}

async function changeCompleted (todo: Todo) {
  const newTodo = await todoApi.updateTodo({
    id: todo.id,
    completed: todo.completed,
  })
  refreshRemaining()

  Object.assign(todo, newTodo)  
}

async function removeCompleted() {
  const removeCount = await todoApi.removeCompleted()
  refreshTodo()
}

</script>

<template>
  <section class="todoapp">
    <header class="header">
      <h1>todos</h1>
      <input
        class="new-todo"
        autofocus
        placeholder="What needs to be done?"
        @keyup.enter="addTodo"
      >
    </header>
    <section class="main" v-show="todos.length">
      <input
        id="toggle-all"
        class="toggle-all"
        type="checkbox"
        :checked="remaining === 0"
        @change="toggleAll"
      >
      <label for="toggle-all">Mark all as complete</label>
      <ul class="todo-list">
        <li
          v-for="todo in todos"
          class="todo"
          :key="todo.id"
          :class="{ completed: todo.completed, editing: todo === editedTodo }"
        >
          <div class="view">
            <input class="toggle" type="checkbox" v-model="todo.completed" @change="changeCompleted(todo)">
            <label @dblclick="editTodo(todo)">{{ todo.title }}</label>
            <button class="destroy" @click="removeTodo(todo)"></button>
          </div>
          <input
            v-if="todo === editedTodo"
            class="edit"
            type="text"
            v-model="todo.title"
            @vue:mounted="({ el }) => el.focus()"
            @blur="doneEdit(todo)"
            @keyup.enter="doneEdit(todo)"
            @keyup.escape="cancelEdit(todo)"
          >
        </li>
      </ul>
    </section>
    <footer class="footer" >
      <span class="todo-count">
        <strong>{{ remaining }}</strong>
        <span>{{ remaining === 1 ? ' item' : ' items' }} left</span>
      </span>
      <ul class="filters">
        <li>
          <NuxtLink to="?visibility=all" :class="{ selected: visibility === 'all' }">All</NuxtLink>
        </li>
        <li>
          <NuxtLink to="?visibility=active" :class="{ selected: visibility === 'active' }">Active</NuxtLink>
        </li>
        <li>
          <NuxtLink to="?visibility=completed" :class="{ selected: visibility === 'completed' }">Completed</NuxtLink>
        </li>
      </ul>
      <button class="clear-completed" @click="removeCompleted" v-show="todos.length > remaining">
        Clear completed
      </button>
    </footer>
  </section>
</template>

<style>
@import "todomvc-app-css/index.css";
</style>