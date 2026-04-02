import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type ModerationResultEmailProps = {
  actionLabel: string;
  moderationStatusLabel: string;
  reviewNote: string | null;
  wallpaperTitle: string;
  wallpaperUrl: string;
};

export function ModerationResultEmail({
  actionLabel,
  moderationStatusLabel,
  reviewNote,
  wallpaperTitle,
  wallpaperUrl,
}: ModerationResultEmailProps) {
  return (
    <Html lang="zh-CN">
      <Head />
      <Preview>{`你在 Lumen 的作品《${wallpaperTitle}》有新的审核结果`}</Preview>
      <Body
        style={{
          backgroundColor: "#F2EDE4",
          color: "#0A0804",
          fontFamily: '"Instrument Sans", Helvetica, Arial, sans-serif',
          margin: 0,
          padding: "32px 16px",
        }}
      >
        <Container
          style={{
            border: "1.5px solid #0A0804",
            maxWidth: "560px",
            padding: "32px",
          }}
        >
          <Text
            style={{
              fontSize: "32px",
              letterSpacing: "0.18em",
              lineHeight: 1,
              margin: 0,
            }}
          >
            Lumen
          </Text>

          <Text
            style={{
              color: "#D42B2B",
              fontSize: "11px",
              letterSpacing: "0.28em",
              margin: "18px 0 0",
              textTransform: "uppercase",
            }}
          >
            Moderation Update
          </Text>

          <Text
            style={{
              fontSize: "18px",
              lineHeight: "32px",
              margin: "20px 0 0",
            }}
          >
            你的作品《{wallpaperTitle}》刚刚完成了一次内容审核。
          </Text>

          <Section
            style={{
              border: "1.5px solid #0A0804",
              marginTop: "24px",
              padding: "18px 20px",
            }}
          >
            <Text
              style={{
                color: "#8A8070",
                fontSize: "12px",
                letterSpacing: "0.22em",
                margin: 0,
                textTransform: "uppercase",
              }}
            >
              审核结果
            </Text>
            <Text
              style={{
                fontSize: "18px",
                lineHeight: "30px",
                margin: "14px 0 0",
              }}
            >
              处理状态：{moderationStatusLabel}
            </Text>
            <Text
              style={{
                fontSize: "18px",
                lineHeight: "30px",
                margin: "8px 0 0",
              }}
            >
              作品动作：{actionLabel}
            </Text>
            {reviewNote ? (
              <Text
                style={{
                  fontSize: "15px",
                  lineHeight: "28px",
                  margin: "14px 0 0",
                }}
              >
                审核备注：{reviewNote}
              </Text>
            ) : null}
          </Section>

          <Section style={{ margin: "28px 0 0" }}>
            <Button
              href={wallpaperUrl}
              style={{
                backgroundColor: "#0A0804",
                border: "1.5px solid #0A0804",
                color: "#F2EDE4",
                display: "inline-block",
                fontSize: "12px",
                letterSpacing: "0.22em",
                padding: "14px 22px",
                textDecoration: "none",
                textTransform: "uppercase",
              }}
            >
              查看作品详情
            </Button>
          </Section>

          <Text
            style={{
              color: "#8A8070",
              fontSize: "13px",
              lineHeight: "24px",
              margin: "24px 0 0",
            }}
          >
            如果你认为这次审核存在误判，可以回复本邮件或通过站内方式联系编辑团队。
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
