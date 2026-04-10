'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
};

export default function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumbs,
}: PageHeaderProps) {
  return (
    <div className="page-head">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="breadcrumb" className="breadcrumb mb-2">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <span
                  key={`${item.label}-${index}`}
                  className="inline-flex items-center gap-1.5"
                >
                  {item.href && !isLast ? (
                    <Link href={item.href} className="breadcrumb-seg">
                      {item.label}
                    </Link>
                  ) : (
                    <span className={isLast ? 'breadcrumb-current' : 'breadcrumb-seg'}>
                      {item.label}
                    </span>
                  )}
                  {!isLast ? (
                    <ChevronRight className="breadcrumb-sep" aria-hidden="true" />
                  ) : null}
                </span>
              );
            })}
          </nav>
        ) : null}
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div>{actions}</div> : null}
    </div>
  );
}
