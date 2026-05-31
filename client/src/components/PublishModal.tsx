import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Link, X } from 'lucide-react';
import { toast } from 'sonner';

interface InvitedUser {
  email: string;
  role: string; // e.g., '소유자', '개인'
}

export function PublishModal() {
  const [publicUrl, setPublicUrl] = useState('constmanager-mwdrw6f3.manus.space');
  const [visibility, setVisibility] = useState('invited'); // 'invited' or 'public'
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([
    { email: 'tubebluemoon@gmail.com', role: '소유자' },
    { email: 'shinra850202@gmail.com', role: '개인' },
    { email: 'choulsu1@gmail.com', role: '개인' },
    { email: 'lhj1682@gmail.com', role: '개인' },
  ]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success('공개 URL이 클립보드에 복사되었습니다.');
  };

  const handleInviteUser = () => {
    if (inviteEmail && !invitedUsers.some(user => user.email === inviteEmail)) {
      setInvitedUsers([...invitedUsers, { email: inviteEmail, role: '개인' }]);
      setInviteEmail('');
      toast.success(`${inviteEmail}님을 초대했습니다.`);
    } else if (invitedUsers.some(user => user.email === inviteEmail)) {
      toast.error('이미 초대된 사용자입니다.');
    } else {
      toast.error('유효한 이메일 주소를 입력해주세요.');
    }
  };

  const handleRemoveUser = (emailToRemove: string) => {
    setInvitedUsers(invitedUsers.filter(user => user.email !== emailToRemove));
    toast.info(`${emailToRemove}님을 목록에서 제거했습니다.`);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default" className="bg-black text-white hover:bg-gray-800">
          게시
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>게시</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="public-url" className="text-sm font-medium">공개 URL</label>
            <div className="flex items-center space-x-2">
              <Input id="public-url" value={publicUrl} readOnly className="flex-1" />
              <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => window.open(`https://${publicUrl}`, '_blank')}>
                <Link className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="visibility" className="text-sm font-medium">가시성</label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="가시성 설정" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="invited">초대받은 사람만</SelectItem>
                <SelectItem value="public">전체 공개</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {visibility === 'invited' && (
            <div className="flex flex-col gap-2">
              <label htmlFor="invite-email" className="text-sm font-medium">이메일 주소 입력</label>
              <div className="flex items-center space-x-2">
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="이메일 주소 입력"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleInviteUser}>초대</Button>
              </div>
              <div className="mt-2 space-y-2">
                {invitedUsers.map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded-md">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{user.email}</span>
                      <span className="text-sm text-gray-500">({user.role})</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveUser(user.email)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
