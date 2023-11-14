import prisma from '~/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

export const getTodos = defineApi({
  props: z.object({
    completed: z.boolean().optional(),
    title: z.string().optional()
  }),

  handler(data) {
    const where: Prisma.TodoFindManyArgs['where'] = {}
    if ('completed' in data) {
      where.completed = data.completed
    }

    if (data.title) {
      where.title = {
        contains: data.title,
      }
    }

    return prisma.todo.findMany({
      where
    }) 
  },
})

export const getRemaining = defineApi(() => {
  return prisma.todo.count({
    where: { completed: false }
  })
})

export const addTodo = defineApi({
  props: z.object({
    title: z.string().trim().min(1),
  }),

  handler({ title }) {
    return prisma.todo.create({
      data: {
        completed: false,
        title,
      }
    })
  },
})

export const removeTodo = defineApi({
  props: z.number(),
  handler (id) {
    return prisma.todo.delete({
      where: { id }
    })
  }
})

export const removeCompleted = defineApi(() => {
  return prisma.todo.deleteMany({
    where: {
      completed: true,
    }
  })
})

export const updateTodo = defineApi({
  props: z.object({
    id: z.number(),
    title: z.string().optional(),
    completed: z.boolean().optional(),
  }),
  handler (data) {
    return prisma.todo.update({
      where: { id: data.id },
      data,
    })
  }
})

export const batchUpdateTodo = defineApi({
  props: z.object({
    ids: z.number().array(),
    completed: z.boolean(),
  }),

  handler(data) {
    return prisma.todo.updateMany({
      where: { id: {
        in: data.ids,
      } },
      data: {
        completed: data.completed,
      }
    })
  },

})