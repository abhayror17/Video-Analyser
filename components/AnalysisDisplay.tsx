import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AnalysisResult } from '../types';
import { SummaryIcon, SentimentIcon, TopicIcon, TagsIcon, InfoIcon, SegmentsIcon } from './icons';

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const Section: React.FC<SectionProps> = ({ title, icon, children, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    <div className="flex items-center space-x-2">
      {icon}
      <h3 className="text-lg font-semibold text-gray-300">{title}</h3>
    </div>
    <div className="pl-6">{children}</div>
  </div>
);

interface InfoItemProps {
  label: string;
  value: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ label, value }) => (
    <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-base text-gray-200">{value}</p>
    </div>
);


export const AnalysisDisplay: React.FC<{ result: AnalysisResult }> = ({ result }) => {
  return (
    <div className="space-y-8">
      {/* Summary */}
      <Section title="Summary" icon={<SummaryIcon className="w-5 h-5 text-indigo-400" />}>
        <div className="prose prose-invert max-w-none prose-p:text-gray-300">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.summary}</ReactMarkdown>
        </div>
      </Section>

      {/* Key Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <InfoItem label="Sentiment" value={result.sentiment} />
        <InfoItem label="Primary Topic" value={result.primaryTopic} />
        <InfoItem label="Type of Discussion" value={result.typeOfDiscussion} />
        <InfoItem label="Tone of Delivery" value={result.toneOfDelivery} />
        <InfoItem label="Region/Country Focus" value={result.regionCountryFocus} />
      </div>

      {/* Subtopics */}
      <Section title="Subtopics" icon={<TopicIcon className="w-5 h-5 text-indigo-400" />}>
        <div className="flex flex-wrap gap-2">
          {result.subtopics.map((topic, index) => (
            <span key={index} className="px-3 py-1 text-sm font-medium text-purple-200 bg-purple-900/50 rounded-full border border-purple-500/30">
              {topic}
            </span>
          ))}
        </div>
      </Section>
      
      {/* Key People & Entities */}
      <Section title="Key People & Entities" icon={<TagsIcon className="w-5 h-5 text-indigo-400" />}>
        <div className="flex flex-wrap gap-2">
          {result.keyPeopleEntities.map((entity, index) => (
            <span key={index} className="px-3 py-1 text-sm font-medium text-indigo-200 bg-indigo-900/50 rounded-full border border-indigo-500/30">
              {entity}
            </span>
          ))}
        </div>
      </Section>

      {/* Additional Info */}
       <Section title="Additional Info" icon={<InfoIcon className="w-5 h-5 text-indigo-400" />}>
        <div className="prose prose-invert max-w-none prose-p:text-gray-300">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.additionalInfo}</ReactMarkdown>
        </div>
      </Section>

      {/* Segments */}
      <Section title="Segments" icon={<SegmentsIcon className="w-5 h-5 text-indigo-400" />}>
        <div className="space-y-4 border-l-2 border-white/10 pl-4">
          {result.segments.map((segment, index) => (
            <div key={index} className="relative">
               <div className="absolute -left-[26px] top-1.5 w-3 h-3 bg-indigo-400 rounded-full border-2 border-[#0c0a1a]"></div>
               <p className="font-semibold text-gray-200">{segment.title}</p>
               <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                <span>{segment.timestamp}</span>
                <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                <span>Duration: {segment.duration}</span>
               </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
};