'use client'

import { useState } from 'react'
import type { Template, PromotionWithTemplates } from '@/lib/supabase/types'
import { TemplateCard } from './template-card'
import { TemplateModal } from './template-modal'

interface TemplateSectionProps {
  templates: Template[]
  purchasedIds?: string[]
  activePromotions?: PromotionWithTemplates[]
}

export function TemplateSection({ templates, purchasedIds = [], activePromotions = [] }: TemplateSectionProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {templates.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            isPurchased={purchasedIds.includes(t.id)}
            onViewDetail={setSelectedTemplate}
            activePromotions={activePromotions}
          />
        ))}
      </div>

      <TemplateModal
        template={selectedTemplate}
        open={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        isPurchased={selectedTemplate ? purchasedIds.includes(selectedTemplate.id) : false}
        activePromotions={activePromotions}
      />
    </>
  )
}
