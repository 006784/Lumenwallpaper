import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type MagicLinkEmailProps = {
  expiresInMinutes: number;
  magicLink: string;
};

export function MagicLinkEmail({
  expiresInMinutes,
  magicLink,
}: MagicLinkEmailProps) {
  return (
    <Html lang="zh-CN">
      <Head />
      <Preview>你的 Lumen 登录链接已就绪</Preview>
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
            Magic Link
          </Text>

          <Text
            style={{
              fontSize: "18px",
              lineHeight: "32px",
              margin: "20px 0 0",
            }}
          >
            你的登录链接已就绪。点击下面的按钮，即可回到 Lumen 并建立会话。
          </Text>

          <Section style={{ margin: "28px 0" }}>
            <Button
              href={magicLink}
              style={{
                backgroundColor: "#D42B2B",
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
              登录 Lumen
            </Button>
          </Section>

          <Text
            style={{
              color: "#8A8070",
              fontSize: "14px",
              lineHeight: "26px",
              margin: "0 0 16px",
            }}
          >
            这个链接将在 {expiresInMinutes} 分钟后失效，并且只能使用一次。
          </Text>

          <Text
            style={{
              color: "#8A8070",
              fontSize: "13px",
              lineHeight: "24px",
              margin: 0,
            }}
          >
            如果按钮无法点击，你也可以直接打开这个链接：
          </Text>
          <Link
            href={magicLink}
            style={{
              color: "#0A0804",
              display: "block",
              fontSize: "13px",
              lineHeight: "24px",
              marginTop: "10px",
              wordBreak: "break-all",
            }}
          >
            {magicLink}
          </Link>
        </Container>
      </Body>
    </Html>
  );
}
