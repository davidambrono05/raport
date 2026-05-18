import type { TeamMember } from './types';

interface TeamListProps {
  members: TeamMember[];
  onSelect?: (member: TeamMember) => void;
  onAdd?: () => void;
}

export function TeamList({ members, onSelect, onAdd }: TeamListProps) {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold" style={{ color: 'var(--color-foreground)' }}>
          Echipă ({members.length})
        </h2>
        {onAdd && (
          <button
            onClick={onAdd}
            className="rounded-md px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-primary-foreground)',
            }}
          >
            + Angajat nou
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <MemberCard key={member.id} member={member} onClick={() => onSelect?.(member)} />
        ))}
        {members.length === 0 && (
          <p className="col-span-full text-sm py-8 text-center" style={{ color: 'var(--color-muted-foreground)' }}>
            Niciun angajat adăugat.
          </p>
        )}
      </div>
    </div>
  );
}

function MemberCard({ member, onClick }: { member: TeamMember; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-lg border p-4 space-y-3 transition-colors hover:opacity-80"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}
    >
      <div className="flex items-center gap-3">
        {member.avatarUrl ? (
          <img src={member.avatarUrl} alt={member.name} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-primary-foreground)',
            }}
          >
            {member.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-medium truncate" style={{ color: 'var(--color-foreground)' }}>
            {member.name}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            {member.role}
          </p>
        </div>
      </div>

      {(member.activeWorkItems !== undefined || member.completedWorkItems !== undefined) && (
        <div className="flex gap-4 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
          {member.activeWorkItems !== undefined && (
            <span>
              <span className="font-medium" style={{ color: 'var(--color-foreground)' }}>
                {member.activeWorkItems}
              </span>{' '}
              active
            </span>
          )}
          {member.completedWorkItems !== undefined && (
            <span>
              <span className="font-medium" style={{ color: 'var(--color-foreground)' }}>
                {member.completedWorkItems}
              </span>{' '}
              finalizate
            </span>
          )}
        </div>
      )}

      {member.phone && (
        <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
          {member.phone}
        </p>
      )}
    </button>
  );
}
